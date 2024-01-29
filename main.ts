// 导入所需的包
import {
  Contact,
  Message,
  ScanStatus,
  WechatyBuilder,
  log,
}from 'wechaty'
import {ContactImpl, ContactInterface, RoomImpl, RoomInterface} from "wechaty/impls";
import qrcodeTerminal from 'qrcode-terminal'
import {getGPTMessage} from './openai-service'
import DBUtils from "./data";

enum MessageType {
  Unknown = 0,
  Attachment = 1, // Attach(6),
  Audio = 2, // Audio(1), Voice(34)
  Contact = 3, // ShareCard(42)
  ChatHistory = 4, // ChatHistory(19)
  Emoticon = 5, // Sticker: Emoticon(15), Emoticon(47)
  Image = 6, // Img(2), Image(3)
  Text = 7, // Text(1)
  Location = 8, // Location(48)
  MiniProgram = 9, // MiniProgram(33)
  GroupNote = 10, // GroupNote(53)
  Transfer = 11, // Transfers(2000)
  RedEnvelope = 12, // RedEnvelopes(2001)
  Recalled = 13, // Recalled(10002)
  Url = 14, // Url(5)
  Video = 15, // Video(4), Video(43)
  Post = 16, // Moment, Channel, Tweet, etc
}
require('dotenv').config()
const SINGLE_MESSAGE_MAX_SIZE = 500;

export class ChatGPTBot {

  // 处理消息
  async onMessage (message: Message) {
    const talker = message.talker();
    const rawText = message.text();
    const room = message.room();
    const messageType = message.type();
    const privateChat = !room;

    // 打印接收的消息
    if (privateChat) {
      console.log(`🤵 Contact: ${talker.name()} : Text: ${rawText}`)
    } else {
      const topic = await room.topic()
      console.log(`🚪 Room: ${topic} 🤵 Contact: ${talker.name()} : Text: ${rawText}`)
    }

    // 过滤不需要回复的消息
    if (this.isNonsense(talker, messageType, rawText)) {
      return;
    }

    // 根据群消息还是私人消息发送
    // const text = this.cleanMessage(rawText, privateChat);
    if (privateChat) {
      // return await this.onPrivateMessage(talker, text);
      return await this.onPrivateMessage(talker, rawText);
    } else{
      // if (!this.disableGroupMessage){
        // return await this.onGroupMessage(talker, text, room);
        if (await message.mentionSelf()) {
          return await this.onGroupMessage(talker, rawText, room);
        }
      // } else {
        // return;
      // }
    }
  }

  // 解析消息并发送
  async trySay(
    talker: RoomInterface | ContactInterface,
    mesasge: string
  ): Promise<void> {
    const messages: Array<string> = [];
    // if (this.checkChatGPTBlockWords(mesasge)) {
    //   console.log(`🚫 Blocked ChatGPT: ${mesasge}`);
    //   return;
    // }
    let message = mesasge;
    while (message.length > SINGLE_MESSAGE_MAX_SIZE) {
      messages.push(message.slice(0, SINGLE_MESSAGE_MAX_SIZE));
      message = message.slice(SINGLE_MESSAGE_MAX_SIZE);
    }
    messages.push(message);
    for (const msg of messages) {
      await talker.say(msg);
    }
  }

  // 过滤不需要处理的消息
  isNonsense(
    talker: ContactInterface,
    messageType: MessageType,
    text: string
  ): boolean {
    return (
      talker.self() ||
      // TODO: add doc support
      !(messageType == MessageType.Text || messageType == MessageType.Audio) ||
      talker.name() === "微信团队" ||
      // 语音(视频)消息
      text.includes("收到一条视频/语音聊天消息，请在手机上查看") ||
      // 红包消息
      text.includes("收到红包，请在手机上查看") ||
      // Transfer message
      text.includes("收到转账，请在手机上查看") ||
      // 位置消息
      text.includes("/cgi-bin/mmwebwx-bin/webwxgetpubliclinkimg")
      // 聊天屏蔽词
      // this.checkBlockWords(text)
    );
  }

  // 私人消息发送gpt
  async onPrivateMessage(talker: ContactInterface, text: string) {
    if (DBUtils.contains(text)){
      await this.trySay(talker, DBUtils.get(text));
    } else {
      const gptMessage = await getGPTMessage(talker.name(),text);
      await this.trySay(talker, gptMessage);
    }
  }

  // 群组消息发送gpt
  async onGroupMessage(
    talker: ContactInterface,
    text: string,
    room: RoomInterface
  ) {
    const gptMessage = await getGPTMessage(await room.topic(), text);
    const result = `@${talker.name()} ${text}\n\n------\n ${gptMessage}`;
    await this.trySay(room, result);
  }

}

const chatGPTBot = new ChatGPTBot();

// 为指定的人偶生成二维码并将其显示在控制台上需要此功能
function onScan (qrcode: string, status: ScanStatus) {
  if (status === ScanStatus.Waiting || status === ScanStatus.Timeout) {
    const qrcodeImageUrl = [
      'https://wechaty.js.org/qrcode/',
      encodeURIComponent(qrcode),
    ].join('')
    log.info('StarterBot', 'onScan: %s(%s) - %s', ScanStatus[status], status, qrcodeImageUrl)

    qrcodeTerminal.generate(qrcode, { small: true })  // show qrcode on console

  } else {
    log.info('StarterBot', 'onScan: %s(%s)', ScanStatus[status], status)
  }
}

async function main() {
  const initializedAt = Date.now()
  // 当用户登录机器人时，此函数将打印消息
  function onLogin (user: Contact) {
    log.info('StarterBot', '%s login', user)
  }

  // 当用户注销时，这将打印消息
  function onLogout (user: Contact) {
    log.info('StarterBot', '%s logout', user)
  }

  // 通过提供名称来初始化机器人
  const bot = WechatyBuilder.build({
    name: 'ding-dong-bot',
    puppetOptions: {
      uos: true  // 开启uos协议
    },
    puppet: 'wechaty-puppet-wechat',
  })

  // 分配适当的函数以在事件触发时调用
  bot.on('scan',    onScan)
  bot.on('login',   onLogin)
  bot.on('logout',  onLogout)
  bot.on('message', async (message) => {
      // 忽略过期时间的消息
      if (message.date().getTime() < initializedAt) {
        return;
      }
      await chatGPTBot.onMessage(message)
    }
  )

  // 启动机器人
  bot.start()
    .then(() => log.info('StarterBot', 'Starter Bot Started.'))
    .catch(e => log.error('StarterBot', e))

  // 关闭时清理
  const finis = require('finis')
  finis(async (code:any, signal:any) => {
    const exitMsg = `Wechaty exit ${code} because of ${signal} `
    await bot.stop()
    console.log(exitMsg)
    process.exit(-1)
  })
}

main();