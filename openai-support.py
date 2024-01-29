from openai import OpenAI # 用于提供openAI接口服务
import os # 用于修改代理和获取api token
import flask, json # 用于提供web服务
from flask import request
# imports
import openai
import ast  # for converting embeddings saved as strings back to arrays
import pandas as pd  # for storing text and embeddings data
import tiktoken  # for counting tokens
import os # for getting API token from env variable OPENAI_API_KEY
from scipy import spatial  # for calculating vector similarities for search

# api代理
os.environ["http_proxy"] = "http://localhost:7890"
os.environ["https_proxy"] = "http://localhost:7890"
client = OpenAI()

GPT_MODEL = "gpt-4"

# 获取搜索数据集
embeddings_path = "./charlotte-introduction.csv"
df = pd.read_csv(embeddings_path)
EMBEDDING_MODEL = "text-embedding-ada-002"  # OpenAI's best embeddings as of Apr 2023
BATCH_SIZE = 1000  # you can submit up to 2048 embedding inputs per request

embeddings = []
for batch in df['text']:
    response = openai.embeddings.create(model=EMBEDDING_MODEL, input=batch)
    batch_embeddings = [[e for e in response.data[0].embedding]]
    embeddings.extend(batch_embeddings)

df = pd.DataFrame({"text": df['text'], "embedding": embeddings})
# 保存到文件
# df.to_csv('output/embedded_1k_reviews.csv', index=False)
# 从文件中读取
# df = pd.read_csv('output/embedded_1k_reviews.csv')
# df['ada_embedding'] = df.ada_embedding.apply(eval).apply(np.array)

# 搜索函数
# 返回两个列表：前N个文本按相关性排名，他们对应的相关性分数
def strings_ranked_by_relatedness(
    query: str,
    df: pd.DataFrame,
    relatedness_fn=lambda x, y: 1 - spatial.distance.cosine(x, y),
    top_n: int = 100
) -> tuple[list[str], list[float]]:
    # 返回字符串和相关性的列表，按从最相关到最不相关的顺序排序。
    query_embedding_response = openai.embeddings.create(
        model=EMBEDDING_MODEL,
        input=query,
    )
    query_embedding = query_embedding_response.data[0].embedding
    strings_and_relatednesses = [
        (row["text"], relatedness_fn(query_embedding, row["embedding"]))
        for i, row in df.iterrows()
    ]
    strings_and_relatednesses.sort(key=lambda x: x[1], reverse=True)
    strings, relatednesses = zip(*strings_and_relatednesses)
    return strings[:top_n], relatednesses[:top_n]

def num_tokens(text: str, model: str = GPT_MODEL) -> int:
    # 返回字符串中标记的数量
    encoding = tiktoken.encoding_for_model(model)
    return len(encoding.encode(text))

# 将相关性数据嵌入消息
def query_message(
    query: str,
    df: pd.DataFrame,
    model: str,
    token_budget: int
) -> str:
    # 返回 GPT 的消息，其中包含从数据集中提取的相关源文本
    strings, relatednesses = strings_ranked_by_relatedness(query, df)
    introduction = '使用以下有关charlotte的文章来回答后续问题.不要回答"在文章中，他们，以第一人称回复" 如果在文章中找不到答案，请回答"我找不到答案！"'
    question = f"\n\nQuestion: {query}"
    message = introduction
    for string in strings:
        next_article = f'\n\n参考文章:\n"""\n{string}\n"""'
        if (
            num_tokens(message + next_article + question, model=model)
            > token_budget
        ):
            break
        else:
            message += next_article
    return message + question

# 接受用户查询
# 搜索与查询相关的文本
# 将该文本填充到 GPT 消息中
# 将消息发送到 GPT
# 返回 GPT 的答案
def ask(
    query: str,
    df: pd.DataFrame,
    model: str = GPT_MODEL,
    token_budget: int = 4096 - 500,
    print_message: bool = True,
) -> str:
    # 使用 GPT 以及相关文本和嵌入的数据框回答查询
    message = query_message(query, df, model=model, token_budget=token_budget)
    if print_message:
        print(message)
    messages = [
        {"role": "system", "content": "你将回答有关charlotte的问题"},
        {"role": "user", "content": message},
    ]
    response = openai.chat.completions.create(
        model=model,
        messages=messages,
        temperature=0
    )
    response_message = response.choices[0].message.content
    return response_message

'''
flask： web框架，通过flask提供的装饰器@server.route()将普通函数转换为服务
登录接口，需要传url、username、passwd
'''
server = flask.Flask(__name__)
# @server.route()可以将普通函数转变为服务 登录接口的路径、请求方式
@server.route('/getGPTMessage', methods=['get', 'post'])
def getGPTMessage() :
    # 获取通过url请求传参的数据
    query = request.values.get('query')

# 调用模型的问答
    # completion = client.chat.completions.create(
    #   model="gpt-3.5-turbo",
    #   messages=[
    #     {"role": "system", "content": "你是一个人工客服"},
    #     {"role": "user", "content": query}
    #   ],
    #   temperature=0,
    # )

    # respon = completion.choices[0].message
    # print(respon)
    # return respon.content

# 调用嵌入搜索的问答
    return ask(query, df)

 
if __name__ == '__main__':
    server.run(debug=True, port=8888, host='0.0.0.0')# 指定端口、host,0.0.0.0代表不管几个网卡，任何ip都可以访问
    # print(ask('charlotte是个什么样的系统', df))