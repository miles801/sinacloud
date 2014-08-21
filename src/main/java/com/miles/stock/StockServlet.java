package com.miles.stock;

import com.google.gson.Gson;
import com.miles.stock.core.StockProvider;
import com.miles.stock.domain.Stock;
import com.miles.wechat.utils.StringUtils;
import org.apache.log4j.Logger;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;

/**
 * Created on 2014/7/30 9:56
 *
 * @author miles
 */
public class StockServlet extends HttpServlet {
    private Logger logger = Logger.getLogger(StockServlet.class);

    @Override
    public void init() throws ServletException {
        super.init();
        logger.info("初始化股票Servlet....");
    }

    @Override
    public void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String stock = req.getParameter("code");
        if (!StringUtils.isEmpty(stock)) {
            List<Stock> data = StockProvider.getInstance().queryStocks(stock.split("\\D+"));
            Gson gson = new Gson();
            resp.setContentType("json/application;charset=utf-8");
            resp.getWriter().write(gson.toJson(data));
        }
    }

    @Override
    public void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        doPost(req, resp);
    }
}
