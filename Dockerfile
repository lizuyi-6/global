FROM modelscope-registry.cn-beijing.cr.aliyuncs.com/modelscope-repo/python:3.10

WORKDIR /home/user/app

# 复制依赖文件并安装
COPY requirements.txt /home/user/app/
RUN pip install --no-cache-dir -r requirements.txt

# 复制应用代码
COPY . /home/user/app

# 暴露端口
EXPOSE 7860

# 启动应用
ENTRYPOINT ["python", "-u", "app.py"]
