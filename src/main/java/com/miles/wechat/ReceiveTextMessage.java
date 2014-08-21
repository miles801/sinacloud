package com.miles.wechat;

import com.miles.wechat.api.MessageType;
import com.miles.wechat.entity.message.ReceiveMessage;
import com.miles.wechat.entity.message.SendMessage;
import com.miles.wechat.event.ReceiveTextMsgEvent;
import org.apache.log4j.Logger;

/**
 * Created on 2014/7/28 14:15
 *
 * @author miles
 */
public class ReceiveTextMessage implements ReceiveTextMsgEvent {
    private Logger logger = Logger.getLogger(ReceiveTextMessage.class);

    @Override
    public SendMessage execute(ReceiveMessage receiveMessage) {
        String from = receiveMessage.getFromUserName();
        logger.info("from:" + from);
        String to = receiveMessage.getToUserName();
        logger.info("to:" + to);
        logger.info("message:" + receiveMessage.getContent());
        System.out.println("from:" + from + "\nto:" + to + "\nmessage:" + receiveMessage.getContent());
        receiveMessage.setFromUserName(to);
        receiveMessage.setToUserName(from);
        SendMessage sendMessage = new SendMessage();
        sendMessage.setContent(receiveMessage.getContent());
        sendMessage.setFromUserName(to);
        sendMessage.setToUserName(from);
        sendMessage.setMessageType(MessageType.TEXT.getValue());
        return sendMessage;
    }
}
