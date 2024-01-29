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
export async function getGPTMessage(username:string, message: string): Promise<string> {
  const response = await openai.chat.completions.create({
    messages: [{ role: 'user', content: message }],
    model: 'gpt-3.5-turbo',
  });

  let assistantMessage = "";
  assistantMessage = response.choices[0].message?.content?.replace(/^\n+|\n+$/g, "") as string;

  // log.info('assistantMessage:', assistantMessage);
  return assistantMessage;
}