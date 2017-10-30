const jwt = require('jsonwebtoken');
const config = require('./config').current;

const init = () => {
    if (!config.server) return;
    var array = config.server.interceptors || [];
    if (array.filter(a => a == interceptor) == 0) {
        array.push(interceptor)
    }
    config.server.interceptors = array
}

const interceptor = (ctx) => {
    //向上下文中增加setToken方法和token对象。
    ctx.setToken = (obj) => {
        ctx.resBody.token = encodeToken(obj);
        return ctx;
    };
    ctx.token = {};

    let clientToken = ctx.request.headers.token || ctx.request.payload && ctx.request.payload.token || ctx.request.url.query.token;
    
    try {
        ctx.token = decodeToken(clientToken);
    } catch (error) {
        var { excludeUrls } = config;
        if (excludeUrls["*"] || excludeUrls[ctx.apiUrl]) return true;

        ctx.error({
            code: '402',
            message: '未登录'
        });
        return false;
    }
    return true;
}

function encodeToken(obj) {
    let { secret, expire } = config;
    let arr = [];

    if (!Array.isArray(obj) && Array.isArray(tokenKeys)) {
        tokenKeys.forEach((k, i) => arr[i] = obj[k])
    } else {
        arr = obj;
    }
    let sub = JSON.stringify(arr);
    let exp = Math.floor(Date.now() / 1000) + expire;
    let str = jwt.sign({ sub, exp }, secret, { algorithm: 'HS512' });
    return str;
}
function decodeToken(str) {
    if (!str) throw ({ code: 10, message: "empty token" });
    let { secret, tokenKeys } = config;

    let json = jwt.verify(str, secret, { algorithms: ['HS512'] });
    let obj = JSON.parse(json.sub)
    Array.isArray(obj) && Array.isArray(tokenKeys) && tokenKeys.forEach((k, i) => obj[k] = obj[i])
    return obj;
}

module.exports = {
    init,
    interceptor,
}