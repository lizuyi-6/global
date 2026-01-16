FROM modelscope-registry.cn-beijing.cr.aliyuncs.com/modelscope-repo/python:3.10

WORKDIR /home/user/app

# 安装 Node.js 和 npm
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs

# 复制 Python 依赖文件并安装
COPY requirements.txt /home/user/app/
RUN pip install --no-cache-dir -r requirements.txt

# 复制前端代码
COPY client/package.json client/package-lock.json* /home/user/app/client/
RUN cd /home/user/app/client && npm install

# 复制所有应用代码
COPY . /home/user/app

# 构建前端
RUN cd /home/user/app/client && npm run build

# 暴露端口
EXPOSE 7860

# 启动应用
ENTRYPOINT ["python", "-u", "app.py"]
