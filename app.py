"""
超简单的 Gradio 测试应用
用于验证 ModelScope 部署是否正常工作
"""

import gradio as gr
import time

def simple_response(name):
    """简单的响应函数"""
    return f"你好 {name}！应用已成功部署 🎉\n当前时间: {time.strftime('%Y-%m-%d %H:%M:%S')}"

# 创建 Gradio 界面
demo = gr.Interface(
    fn=simple_response,
    inputs=gr.Textbox(label="输入你的名字", placeholder="请输入名字"),
    outputs=gr.Textbox(label="响应"),
    title="🚀 ModelScope 部署测试",
    description="这是一个超简单的测试应用，用于验证部署是否成功"
)

if __name__ == "__main__":
    demo.launch(server_name="0.0.0.0", server_port=7860)
