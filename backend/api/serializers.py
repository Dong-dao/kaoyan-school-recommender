from rest_framework import serializers

from .models import University, Major, QueryRecord


class UniversitySerializer(serializers.ModelSerializer):
    """院校序列化器"""
    class Meta:
        model = University
        fields = [
            'id', 'name', 'level', 'major_type', 'min_score', 'avg_score',
            'max_score', 'admission_rate', 'location', 'official_website',
            'description',
        ]


class MajorSerializer(serializers.ModelSerializer):
    """专业序列化器"""
    class Meta:
        model = Major
        fields = ['id', 'name', 'score_offset', 'is_hot']


class RecommendRequestSerializer(serializers.Serializer):
    """推荐请求参数校验"""
    undergraduate_school = serializers.CharField(
        max_length=100, allow_blank=True, required=False, default=''
    )
    target_major = serializers.CharField(
        max_length=100, allow_blank=True, required=False, default=''
    )
    total_score = serializers.IntegerField(min_value=0, max_value=800)
    english_score = serializers.IntegerField(min_value=0, max_value=100, default=0)
    math_score = serializers.IntegerField(min_value=0, max_value=150, default=0, required=False)
    cet4_score = serializers.IntegerField(min_value=0, max_value=710, required=False, allow_null=True)
    cet6_score = serializers.IntegerField(min_value=0, max_value=710, required=False, allow_null=True)


class QueryRecordSerializer(serializers.ModelSerializer):
    """查询记录序列化器"""
    class Meta:
        model = QueryRecord
        fields = '__all__'
