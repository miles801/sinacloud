package com.miles.wechat;

import com.miles.wechat.api.MessageType;
import com.miles.wechat.entity.message.ReceiveMessage;
import com.miles.wechat.entity.message.SendMessage;
import com.miles.wechat.event.SubscribeEvent;

/**
 * Created on 2014/7/28 14:29
 *
 * @author miles
 */
public class Subscribe implements SubscribeEvent {
    @Override
    public SendMessage execute(ReceiveMessage receiveMessage) {
        String from = receiveMessage.getFromUserName();
        String to = receiveMessage.getToUserName();
        System.out.println("from:" + from + "\nto:" + to + "\nmessage:" + receiveMessage.getContent());
        SendMessage sendMessage = new SendMessage();
        sendMessage.setContent("谢谢关注!<a href='http://miles801.sinaapp.com/'>我的主页</a>");
        sendMessage.setFromUserName(to);
        sendMessage.setToUserName(from);
        sendMessage.setMessageType(MessageType.TEXT.getValue());
        return sendMessage;
    }
}
