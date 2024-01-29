import OpenAI from 'openai';
import { HttpsProxyAgent } from 'https-proxy-agent';
import {log} from 'wechaty'

// 配置代理
const openai = new OpenAI({
  httpAgent: new HttpsProxyAgent('http://localhost:7890'),
});
/**
 * 从openAI中获取回答
 * @param username 发问人
 * @param message 发问内容
 */
export async function getGPTMessageOnNode(username:string, message: string): Promise<string> {
  const response = await openai.chat.completions.create({
    messages: [{ role: 'user', content: message }],
    model: 'gpt-3.5-turbo',
  });

  let assistantMessage = "";
  assistantMessage = response.choices[0].message?.content?.replace(/^\n+|\n+$/g, "") as string;

  // log.info('assistantMessage:', assistantMessage);
  return assistantMessage;
}

// 创建axios实例
const axios = require('axios');
export async function getGPTMessageOnPython(message: string): Promise<string> {
  const api = 'http://127.0.0.1:8888/getGPTMessage?query=' + message;
  //axios通过提供对应HTTP请求方法，实现GET/POST/PUT 等对应的请求发送
  return axios.get(api)
    .then(function (response: any) {
      //这里获得整个请求响应对象
      console.log(response.data)
      return response.data;
      //获取商品数据只需要调用:  response.data
    }).catch(function (error: any) {
      console.log(error);
      return '对不起，暂时不能回答该问题！'
    })
}
