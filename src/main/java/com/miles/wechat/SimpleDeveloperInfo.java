package com.miles.wechat;

import com.miles.wechat.api.DeveloperInfo;

/**
 * Created on 2014/7/28 11:58
 *
 * @author miles
 */
public class SimpleDeveloperInfo implements DeveloperInfo {
    @Override
    public String getToken() {
        return "miles";
    }

    @Override
    public String getAppId() {
        return "";
    }

    @Override
    public String getSecret() {
        return "";
    }
}
