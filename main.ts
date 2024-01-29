// 导入所需的包
import {
  Contact,
  Message,
  ScanStatus,
  WechatyBuilder,
  log,
}from 'wechaty'

import qrcodeTerminal from 'qrcode-terminal'

require('dotenv').config()

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

// 当用户登录机器人时，此函数将打印消息
function onLogin (user: Contact) {
  log.info('StarterBot', '%s login', user)
}

// 当用户注销时，这将打印消息
function onLogout (user: Contact) {
  log.info('StarterBot', '%s logout', user)
}

// 消息上
async function onMessage (msg: Message) {
  //log.info('talker().name()', msg.talker())

  if (msg.self()) {
    log.info('我：', msg.text())
  } else {
    await msg.say('好的')
  }
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
bot.on('message', onMessage)

// 启动机器人
bot.start()
  .then(() => log.info('StarterBot', 'Starter Bot Started.'))
  .catch(e => log.error('StarterBot', e))