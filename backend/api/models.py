from django.db import models


class University(models.Model):
    """
    院校模型：存储各高校考研相关数据
    """
    name = models.CharField('院校名称', max_length=100, unique=True)
    level = models.CharField('院校档次', max_length=50, blank=True, default='')
    major_type = models.CharField('学位类型', max_length=20, choices=[
        ('学硕', '学硕'),
        ('专硕', '专硕'),
        ('专业组', '专业组'),
    ], default='专硕')
    min_score = models.IntegerField('最低录取分', default=0)
    avg_score = models.IntegerField('平均录取分', default=0)
    max_score = models.IntegerField('最高录取分', default=0)
    admission_rate = models.FloatField('录取率(%)', default=0)
    location = models.CharField('所在城市', max_length=50, blank=True, default='')
    official_website = models.URLField('官网链接', blank=True, default='')
    description = models.TextField('院校简介', blank=True, default='')
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)

    class Meta:
        verbose_name = '院校'
        verbose_name_plural = verbose_name
        ordering = ['-avg_score']

    def __str__(self):
        return self.name


class Major(models.Model):
    """
    专业模型：存储各院校招生专业及复试线
    """
    name = models.CharField('专业名称', max_length=100)
    university = models.ForeignKey(
        University, on_delete=models.CASCADE, related_name='majors',
        verbose_name='所属院校'
    )
    score_offset = models.IntegerField('分数偏移量', default=0,
        help_text='该专业相对基准分的浮动值，如计算机+15，教育学-10')
    is_hot = models.BooleanField('是否热门专业', default=False)
    created_at = models.DateTimeField('创建时间', auto_now_add=True)

    class Meta:
        verbose_name = '专业'
        verbose_name_plural = verbose_name
        unique_together = ('name', 'university')
        ordering = ['name']

    def __str__(self):
        return f'{self.university.name}-{self.name}'


class QueryRecord(models.Model):
    """
    用户查询记录：记录用户的推荐查询请求与结果
    """
    undergraduate_school = models.CharField('本科院校', max_length=100, blank=True, default='')
    target_major = models.CharField('目标专业', max_length=100, blank=True, default='')
    total_score = models.IntegerField('模拟总分', default=0)
    english_score = models.IntegerField('英语分数', default=0)
    math_score = models.IntegerField('数学分数', default=0)
    cet4_score = models.IntegerField('四级分数', null=True, blank=True)
    cet6_score = models.IntegerField('六级分数', null=True, blank=True)
    result_json = models.TextField('推荐结果(JSON)', blank=True, default='')
    created_at = models.DateTimeField('查询时间', auto_now_add=True)

    class Meta:
        verbose_name = '查询记录'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.undergraduate_school}-{self.total_score}分'
