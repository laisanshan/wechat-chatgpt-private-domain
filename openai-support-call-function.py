from openai import OpenAI
import os
import flask, json
from flask import request
import json

# gpt调用函数的方式
os.environ["http_proxy"] = "http://localhost:7890"
os.environ["https_proxy"] = "http://localhost:7890"
client = OpenAI()

tools = [
    {
        "type": "function",
        "function": {
            "name": "generate_form",
            "description": "生成表单",
            "parameters": {
                "type": "object",
                "properties": {
                    "field": {
                        "type": "string",
                        "description": "表单的字段",
                    },
                    "name": {
                        "type": "string",
                        "description": "表单的名称",
                    },
                },
                "required": ["field", "name"],
            },
        }
    },
]

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
      model="gpt-3.5-turbo-1106",
      messages=[
        {"role": "system", "content": "不要假设将哪些值插入到函数中。 如果用户请求不明确，请要求说明清楚"},
        {"role": "user", "content": query}
      ],
      temperature=0,
      tools=tools,
    )

    respon = json.loads(completion.model_dump_json())
    print(respon)
    return respon["choices"][0]["message"]
 
if __name__ == '__main__':
    server.run(debug=True, port=8888, host='0.0.0.0')# 指定端口、host,0.0.0.0代表不管几个网卡，任何ip都可以访问