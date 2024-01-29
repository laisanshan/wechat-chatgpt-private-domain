from openai import OpenAI
import os
import flask, json
from flask import request

os.environ["http_proxy"] = "http://localhost:7890"
os.environ["https_proxy"] = "http://localhost:7890"
client = OpenAI()

'''
flask： web框架，通过flask提供的装饰器@server.route()将普通函数转换为服务
登录接口，需要传url、username、passwd
'''
# 创建一个服务，把当前这个python文件当做一个服务
server = flask.Flask(__name__)
# server.config['JSON_AS_ASCII'] = False
# @server.route()可以将普通函数转变为服务 登录接口的路径、请求方式
@server.route('/getGPTMessage', methods=['get', 'post'])
def getGPTMessage() :
    # 获取通过url请求传参的数据
    query = request.values.get('query')

    completion = client.chat.completions.create(
      model="gpt-3.5-turbo",
      messages=[
        {"role": "system", "content": "你是一个人工客服"},
        {"role": "user", "content": query}
      ],
      temperature=0,
    )

    respon = completion.choices[0].message
    print(respon)
    return respon.content
 
if __name__ == '__main__':
    server.run(debug=True, port=8888, host='0.0.0.0')# 指定端口、host,0.0.0.0代表不管几个网卡，任何ip都可以访问