import json
import logging

from django.db.models import Q
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import University, QueryRecord
from .serializers import (
    RecommendRequestSerializer,
    UniversitySerializer,
    QueryRecordSerializer,
)
from .services.deepseek import deepseek_service
from .services.local_recommender import local_recommender

logger = logging.getLogger(__name__)


@api_view(['GET'])
def health_check(request):
    """健康检查接口"""
    return Response({
        'status': 'ok',
        'message': '考研院校推荐系统后端运行正常',
        'deepseek_configured': bool(deepseek_service._get_headers().get('Authorization') != 'Bearer '),
    })


@api_view(['GET'])
def list_universities(request):
    """院校列表接口（支持按名称/地点筛选）"""
    queryset = University.objects.all()
    name = request.query_params.get('name')
    location = request.query_params.get('location')
    if name:
        queryset = queryset.filter(name__icontains=name)
    if location:
        queryset = queryset.filter(location__icontains=location)
    serializer = UniversitySerializer(queryset, many=True)
    return Response(serializer.data)


@api_view(['GET'])
def university_detail(request, university_id):
    """院校详情接口"""
    try:
        university = University.objects.get(id=university_id)
    except University.DoesNotExist:
        return Response({'error': '院校不存在'}, status=status.HTTP_404_NOT_FOUND)
    serializer = UniversitySerializer(university)
    return Response(serializer.data)


@api_view(['POST'])
def recommend(request):
    """
    院校推荐接口
    优先调用 Deepseek 大模型生成推荐；若未配置 API Key 则降级为本地算法。
    """
    serializer = RecommendRequestSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(
            {'error': '参数校验失败', 'detail': serializer.errors},
            status=status.HTTP_400_BAD_REQUEST,
        )

    data = serializer.validated_data
    logger.info('收到推荐请求: %s', data)

    try:
        if settings_deepseek_configured():
            # 调用 Deepseek 生成推荐
            result = deepseek_service.generate_recommendation(data)
            universities = result.get('universities', [])
            source = 'deepseek'
        else:
            # 降级为本地算法
            universities = local_recommender.recommend(data)
            source = 'local'
    except Exception as e:
        logger.error('推荐生成失败，降级为本地算法: %s', e)
        # 出错时降级为本地算法
        universities = local_recommender.recommend(data)
        source = 'local_fallback'

    # 保存查询记录
    record = QueryRecord.objects.create(
        undergraduate_school=data.get('undergraduate_school', ''),
        target_major=data.get('target_major', ''),
        total_score=data.get('total_score', 0),
        english_score=data.get('english_score', 0),
        math_score=data.get('math_score', 0),
        cet4_score=data.get('cet4_score'),
        cet6_score=data.get('cet6_score'),
        result_json=json.dumps(universities, ensure_ascii=False),
    )

    return Response({
        'success': True,
        'source': source,
        'user_input': data,
        'universities': universities,
        'record_id': record.id,
    })


@api_view(['GET'])
def query_records(request):
    """查询记录列表接口"""
    records = QueryRecord.objects.all()[:50]
    serializer = QueryRecordSerializer(records, many=True)
    return Response(serializer.data)


def settings_deepseek_configured() -> bool:
    """检查 Deepseek 是否已配置 API Key"""
    from django.conf import settings
    return bool(settings.DEEPSEEK_API_KEY)
