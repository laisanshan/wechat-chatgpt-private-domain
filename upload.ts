import fs from 'fs';
import OpenAI, { toFile } from 'openai';
import { HttpsProxyAgent } from 'https-proxy-agent';

// 微调模型demo --- 结论：不可靠
const openai = new OpenAI({
  httpAgent: new HttpsProxyAgent('http://localhost:7890'),
});
async function main() {
  // 上传训练数据
  // const file = await openai.files.create({ file: fs.createReadStream('./charlotte-fine-tuned-model.jsonl') as any, purpose: 'fine-tune' });
  // console.log(file)
  // console.log(file.id)

  // 训练模型
  const fineTune = await openai.fineTuning.jobs.create({ 
    training_file: 'file-xxxxx', 
    model: 'ft:gpt-3.5-turbo-0613:personal::xxxx' 
  })
  console.log(fineTune)
  console.log(fineTune.model)

  // 列出模型
  // const list = await openai.fineTuning.jobs.list();
  // for await (const fineTune of list) {
  //   // status: 'succeeded'
  //   console.log(fineTune);
  //   console.log(fineTune.fine_tuned_model);
  // }

  // 测试模型
  const completion = await openai.chat.completions.create({
    messages: [
      { role: "system", content: "你是一个charlotte项目的产品经理，需要指导用户使用该项目。" },
      { role: "user", content: "charlotte项目的作者是谁" }
    ],
    model: "ft:gpt-3.5-turbo-0613:personal::xxx",
  });
  console.log(completion.choices[0]);
}

main();
