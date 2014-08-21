package com.miles.wechat;

import com.miles.wechat.api.DeveloperInfo;
import com.miles.wechat.core.WeChatContext;

/**
 * Created on 2014/7/28 11:56
 *
 * @author miles
 */
public class SimpleContext implements WeChatContext {
    @Override
    public String getAccount() {
        return "gh_96bfb823af1e";
    }

    @Override
    public DeveloperInfo getDeveloperInfo() {
        return null;
    }
}
