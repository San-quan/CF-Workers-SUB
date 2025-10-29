let mytoken = 'sssss';
let guestToken = '123'; // 可以随便取，或用https://1024tools.com/uuid生成
let BotToken = '7794095577:AAEh5iVrFCXBicnZ2G1eOzGM5smx43hvqRI'; // 可为空，或@BotFather创建bot
let ChatID = '6919196077'; // 可为空，或@userinfobot获取
let TG = 0; // 1:推送所有访问，0:不推送订阅转换访问
let FileName = 'sanbaopeizhi';
let SUBUpdateTime = 6; // 订阅更新间隔（小时）
let total = 99; // TB
let timestamp = 4102329600000; // 2099-12-31过期
let MainData = `
3605359c17b341b99429260cf5499523
`; // 节点链接 + 订阅链接
let urls = [];
let subConverter = "SUBAPI.cmliussss.net"; // 订阅转换后端
let subConfig = ""; // 订阅配置文件，从KV加载隐藏
let subProtocol = 'https';
let previousSubData = ''; // 用于diff计算的上次订阅数据
let api_mode = true; // 启用API模式（默认true，可env.API_MODE覆盖）

export default {
  async fetch(request, env) {
    const userAgentHeader = request.headers.get('User-Agent');
    const userAgent = userAgentHeader ? userAgentHeader.toLowerCase() : "null";
    const url = new URL(request.url);
    const token = url.searchParams.get('token');
    mytoken = env.TOKEN || mytoken;
    BotToken = env.TGTOKEN || BotToken;
    ChatID = env.TGID || ChatID;
    TG = env.TG || TG;
    subConverter = env.SUBAPI || subConverter;
    if (subConverter.startsWith("http://")) {
      subConverter = subConverter.slice(7);
      subProtocol = 'http';
    } else if (subConverter.startsWith("https://")) {
      subConverter = subConverter.slice(8);
    }
    FileName = env.SUBNAME || FileName;
    api_mode = env.API_MODE !== undefined ? env.API_MODE === 'true' : api_mode; // 支持env.API_MODE配置
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    const timeTemp = Math.ceil(currentDate.getTime() / 1000);
    const fakeToken = await MD5MD5(`${mytoken}${timeTemp}`);
    guestToken = env.GUESTTOKEN || env.GUEST || guestToken || await MD5MD5(mytoken);
    const 访客订阅 = guestToken;

    let UD = Math.floor(((timestamp - Date.now()) / timestamp * total * 1099511627776) / 2);
    total = total * 1099511627776;
    let expire = Math.floor(timestamp / 1000);
    SUBUpdateTime = env.SUBUPTIME || SUBUpdateTime;

    // 从KV加载隐藏的subConfig
    if (env.KV) {
      subConfig = await env.KV.get('SUB_CONFIG') || subConfig; // KV键SUB_CONFIG存.ini内容
    }

    if (!([mytoken, fakeToken, 访客订阅].includes(token) || url.pathname === `/${mytoken}` || url.pathname.includes(`/${mytoken}?`))) {
      if (TG === 1 && url.pathname !== "/" && url.pathname !== "/favicon.ico") {
        await sendMessage(`#异常访问 ${FileName}`, request.headers.get('CF-Connecting-IP'), `UA: ${userAgent}</tg-spoiler>\n域名: ${url.hostname}\n<tg-spoiler>入口: ${url.pathname + url.search}</tg-spoiler>`);
      }
      if (env.URL302) return Response.redirect(env.URL302, 302);
      else if (env.URL) return await proxyURL(env.URL, url);
      else return new Response(await nginx(), { status: 200, headers: { 'Content-Type': 'text/html; charset=UTF-8' } });
    }

    if (env.KV) {
      await 迁移地址列表(env, 'LINK.txt');
      previousSubData = await env.KV.get('PREV_SUB_DATA') || ''; // 加载上次数据用于diff
      if (userAgent.includes('mozilla') && !url.search) {
        await sendMessage(`#编辑订阅 ${FileName}`, request.headers.get('CF-Connecting-IP'), `UA: ${userAgentHeader}</tg-spoiler>\n域名: ${url.hostname}\n<tg-spoiler>入口: ${url.pathname + url.search}</tg-spoiler>`);
        return await KV(request, env, 'LINK.txt', 访客订阅);
      } else {
        MainData = await env.KV.get('LINK.txt') || MainData;
      }
    } else {
      MainData = env.LINK || MainData;
      if (env.LINKSUB) urls = await ADD(env.LINKSUB);
    }

    let 重新汇总所有链接 = await ADD(MainData + '\n' + urls.join('\n'));
    let 自建节点 = "";
    let 订阅链接 = "";
    for (let x of 重新汇总所有链接) {
      if (x.toLowerCase().startsWith('http')) 订阅链接 += x + '\n';
      else 自建节点 += x + '\n';
    }
    MainData = 自建节点;
    urls = await ADD(订阅链接);

    await sendMessage(`#获取订阅 ${FileName}`, request.headers.get('CF-Connecting-IP'), `UA: ${userAgentHeader}</tg-spoiler>\n域名: ${url.hostname}\n<tg-spoiler>入口: ${url.pathname + url.search}</tg-spoiler>`);

    const isSubConverterRequest = request.headers.get('subconverter-request') || request.headers.get('subconverter-version') || userAgent.includes('subconverter');
    let 订阅格式 = 'base64';
    if (!(userAgent.includes('null') || isSubConverterRequest || userAgent.includes('nekobox') || userAgent.includes(('CF-Workers-SUB').toLowerCase()))) {
      if (userAgent.includes('sing-box') || userAgent.includes('singbox') || url.searchParams.has('sb') || url.searchParams.has('singbox')) 订阅格式 = 'singbox';
      else if (userAgent.includes('surge') || url.searchParams.has('surge')) 订阅格式 = 'surge';
      else if (userAgent.includes('quantumult') || url.searchParams.has('quanx')) 订阅格式 = 'quanx';
      else if (userAgent.includes('loon') || url.searchParams.has('loon')) 订阅格式 = 'loon';
      else if (userAgent.includes('clash') || userAgent.includes('meta') || userAgent.includes('mihomo') || url.searchParams.has('clash')) 订阅格式 = 'clash';
    }

    let subConverterUrl;
    let 订阅转换URL = `${url.origin}/${await MD5MD5(fakeToken)}?token=${fakeToken}`;
    let req_data = MainData;
    let 追加UA = 'v2rayn';
    if (url.searchParams.has('b64') || url.searchParams.has('base64')) 订阅格式 = 'base64';
    else if (url.searchParams.has('clash')) 追加UA = 'clash';
    else if (url.searchParams.has('singbox')) 追加UA = 'singbox';
    else if (url.searchParams.has('surge')) 追加UA = 'surge';
    else if (url.searchParams.has('quanx')) 追加UA = 'Quantumult%20X';
    else if (url.searchParams.has('loon')) 追加UA = 'Loon';

    const 订阅链接数组 = [...new Set(urls)].filter(item => item?.trim());
    if (订阅链接数组.length > 0) {
      const [请求订阅响应内容, 订阅转换URLs] = await getSUB(订阅链接数组, request, 追加UA, userAgentHeader);
      req_data += 请求订阅响应内容.join('\n');
      订阅转换URL += "|" + 订阅转换URLs;
      if (订阅格式 === 'base64' && !isSubConverterRequest && 订阅转换URLs.includes('://')) {
        subConverterUrl = `${subProtocol}://${subConverter}/sub?target=mixed&url=${encodeURIComponent(订阅转换URLs)}&insert=false&config=${encodeURIComponent(subConfig)}&emoji=true&list=false&tfo=false&scv=true&fdn=false&sort=false&new_name=true`;
        try {
          const subConverterResponse = await fetch(subConverterUrl, { headers: { 'User-Agent': 'v2rayN/CF-Workers-SUB[](https://github.com/cmliu/CF-Workers-SUB)' } });
          if (subConverterResponse.ok) {
            const subConverterContent = await subConverterResponse.text();
            req_data += '\n' + atob(subConverterContent);
          }
        } catch (error) {
          console.error('订阅转换失败:', error);
        }
      }
    }

    if (env.WARP) 订阅转换URL += "|" + (await ADD(env.WARP)).join("|");

    const utf8Encoder = new TextEncoder();
    const encodedData = utf8Encoder.encode(req_data);
    const utf8Decoder = new TextDecoder();
    const text = utf8Decoder.decode(encodedData);
    const uniqueLines = new Set(text.split('\n').map(line => line.trim()).filter(line => line));
    const result = [...uniqueLines].join('\n');

    const currentSubData = result;
    const diff = computeDiff(previousSubData, currentSubData);
    if (diff && BotToken && ChatID) {
      await sendMessage(`#订阅构建完成 ${FileName} Diff: ${diff}`, request.headers.get('CF-Connecting-IP'), `更新详情`);
    }
    if (env.KV) await env.KV.put('PREV_SUB_DATA', currentSubData);

    let base64Data = btoa(result);

    const responseHeaders = {
      "content-type": "text/plain; charset=utf-8",
      "Profile-Update-Interval": `${SUBUpdateTime}`,
      "Profile-web-page-url": request.url.includes('?') ? request.url.split('?')[0] : request.url,
    };

    if (订阅格式 === 'base64' || token === fakeToken) {
      return new Response(base64Data, { headers: responseHeaders });
    }

    if (订阅格式 === 'clash') {
      subConverterUrl = `${subProtocol}://${subConverter}/sub?target=clash&url=${encodeURIComponent(订阅转换URL)}&insert=false&config=${encodeURIComponent(subConfig)}&emoji=true&list=false&tfo=false&scv=true&fdn=false&sort=false&new_name=true`;
      subConverterUrl += '&append_config=' + encodeURIComponent(getEnhancedClashConfig());
    } else if (订阅格式 === 'singbox') subConverterUrl = `${subProtocol}://${subConverter}/sub?target=singbox&url=${encodeURIComponent(订阅转换URL)}&insert=false&config=${encodeURIComponent(subConfig)}&emoji=true&list=false&tfo=false&scv=true&fdn=false&sort=false&new_name=true`;
    else if (订阅格式 === 'surge') subConverterUrl = `${subProtocol}://${subConverter}/sub?target=surge&ver=4&url=${encodeURIComponent(订阅转换URL)}&insert=false&config=${encodeURIComponent(subConfig)}&emoji=true&list=false&tfo=false&scv=true&fdn=false&sort=false&new_name=true`;
    else if (订阅格式 === 'quanx') subConverterUrl = `${subProtocol}://${subConverter}/sub?target=quanx&url=${encodeURIComponent(订阅转换URL)}&insert=false&config=${encodeURIComponent(subConfig)}&emoji=true&list=false&tfo=false&scv=true&fdn=false&sort=false&udp=true`;
    else if (订阅格式 === 'loon') subConverterUrl = `${subProtocol}://${subConverter}/sub?target=loon&url=${encodeURIComponent(订阅转换URL)}&insert=false&config=${encodeURIComponent(subConfig)}&emoji=true&list=false&tfo=false&scv=true&fdn=false&sort=false`;

    try {
      const subConverterResponse = await fetch(subConverterUrl, { headers: { 'User-Agent': userAgentHeader } });
      if (!subConverterResponse.ok) throw new Error('转换失败');
      let subConverterContent = await subConverterResponse.text();
      if (订阅格式 === 'clash') subConverterContent = clashFix(subConverterContent);
      if (!userAgent.includes('mozilla')) responseHeaders["Content-Disposition"] = `attachment; filename*=utf-8''${encodeURIComponent(FileName)}`;
      return new Response(subConverterContent, { headers: responseHeaders });
    } catch (error) {
      console.error('转换错误:', error);
      return new Response(base64Data, { headers: responseHeaders });
    }
  }
};

async function ADD(envadd) {
  if (!envadd) return [];
  const addtext = envadd.replace(/\s+/g, '\n').trim();
  return [...new Set(addtext.split('\n').filter(line => line.trim()))];
}

async function nginx() {
  const text = `
<!DOCTYPE html>
<html>
<head>
<title>Welcome to nginx!</title>
<style>
body {
width: 35em;
margin: 0 auto;
font-family: Tahoma, Verdana, Arial, sans-serif;
}
</style>
</head>
<body>
<h1>Welcome to nginx!</h1>
<p>If you see this page, the nginx web server is successfully installed and
working. Further configuration is required.</p>
<p>For online documentation and support please refer to
<a href="http://nginx.org/">nginx.org</a>.<br/>
Commercial support is available at
<a href="http://nginx.com/">nginx.com</a>.</p>
<p><em>Thank you for using nginx.</em></p>
</body>
</html>
`;
  return text;
}

async function sendMessage(type, ip, add_data = "") {
  if (BotToken !== '' && ChatID !== '') {
    let msg = "";
    const response = await fetch(`http://ip-api.com/json/${ip}?lang=zh-CN`);
    if (response.status === 200) {
      const ipInfo = await response.json();
      msg = `${type}\nIP: ${ip}\n国家: ${ipInfo.country}\n<tg-spoiler>城市: ${ipInfo.city}\n组织: ${ipInfo.org}\nASN: ${ipInfo.as}\n${add_data}`;
    } else {
      msg = `${type}\nIP: ${ip}\n<tg-spoiler>${add_data}`;
    }
    let url = "https://api.telegram.org/bot" + BotToken + "/sendMessage?chat_id=" + ChatID + "&parse_mode=HTML&text=" + encodeURIComponent(msg);
    return fetch(url, {
      method: 'get',
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;',
        'Accept-Encoding': 'gzip, deflate, br',
        'User-Agent': 'Mozilla/5.0 Chrome/90.0.4430.72'
      }
    });
  }
}

function base64Decode(str) {
  const bytes = new Uint8Array(atob(str).split('').map(c => c.charCodeAt(0)));
  const decoder = new TextDecoder('utf-8');
  return decoder.decode(bytes);
}

async function MD5MD5(text) {
  const encoder = new TextEncoder();
  const firstPass = await crypto.subtle.digest('MD5', encoder.encode(text));
  const firstPassArray = Array.from(new Uint8Array(firstPass));
  const firstHex = firstPassArray.map(b => b.toString(16).padStart(2, '0')).join('');
  const secondPass = await crypto.subtle.digest('MD5', encoder.encode(firstHex.slice(7, 27)));
  const secondPassArray = Array.from(new Uint8Array(secondPass));
  const secondHex = secondPassArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return secondHex.toLowerCase();
}

function clashFix(content) {
  if (content.includes('wireguard') && !content.includes('remote-dns-resolve')) {
    let lines;
    if (content.includes('\r\n')) {
      lines = content.split('\r\n');
    } else {
      lines = content.split('\n');
    }
    let result = "";
    for (let line of lines) {
      if (line.includes('type: wireguard')) {
        const 备改内容 = `, mtu: 1280, udp: true`;
        const 正确内容 = `, mtu: 1280, remote-dns-resolve: true, udp: true`;
        result += line.replace(new RegExp(备改内容, 'g'), 正确内容) + '\n';
      } else {
        result += line + '\n';
      }
    }
    content = result;
  }
  return content;
}

async function proxyURL(proxyURL, url) {
  const URLs = await ADD(proxyURL);
  const fullURL = URLs[Math.floor(Math.random() * URLs.length)];
  let parsedURL = new URL(fullURL);
  let URLProtocol = parsedURL.protocol.slice(0, -1) || 'https';
  let URLHostname = parsedURL.hostname;
  let URLPathname = parsedURL.pathname;
  let URLSearch = parsedURL.search;
  if (URLPathname.charAt(URLPathname.length - 1) === '/') {
    URLPathname = URLPathname.slice(0, -1);
  }
  URLPathname += url.pathname;
  let newURL = `${URLProtocol}://${URLHostname}${URLPathname}${URLSearch}`;
  let response = await fetch(newURL);
  let newResponse = new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers
  });
  newResponse.headers.set('X-New-URL', newURL);
  return newResponse;
}

async function getSUB(api, request, 追加UA, userAgentHeader) {
  if (!api || api.length === 0) {
    return [[], ""];
  } else api = [...new Set(api)];
  let newapi = "";
  let 订阅转换URLs = "";
  let 异常订阅 = "";
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, 2000);
  try {
    const responses = await Promise.allSettled(api.map(apiUrl => getUrl(request, apiUrl, 追加UA, userAgentHeader).then(response => response.ok ? response.text() : Promise.reject(response))));
    const modifiedResponses = responses.map((response, index) => {
      if (response.status === 'rejected') {
        const reason = response.reason;
        if (reason && reason.name === 'AbortError') {
          return { status: '超时', value: null, apiUrl: api[index] };
        }
        console.error(`请求失败: ${api[index]}, 错误信息: ${reason.status} ${reason.statusText}`);
        return { status: '请求失败', value: null, apiUrl: api[index] };
      }
      return { status: response.status, value: response.value, apiUrl: api[index] };
    });
    for (const response of modifiedResponses) {
      if (response.status === 'fulfilled') {
        const content = await response.value || 'null';
        if (content.includes('proxies:')) {
          订阅转换URLs += "|" + response.apiUrl;
        } else if (content.includes('outbounds"') && content.includes('inbounds"')) {
          订阅转换URLs += "|" + response.apiUrl;
        } else if (content.includes('://')) {
          newapi += content + '\n';
        } else if (isValidBase64(content)) {
          newapi += base64Decode(content) + '\n';
        } else {
          const 异常订阅LINK = `trojan://CMLiussss@127.0.0.1:8888?security=tls&allowInsecure=1&type=tcp&headerType=none#%E5%BC%82%E5%B8%B8%E8%AE%A2%E9%98%85%20${response.apiUrl.split('://')[1].split('/')[0]}`;
          异常订阅 += `${异常订阅LINK}\n`;
        }
      }
    }
  } catch (error) {
    console.error(error);
  } finally {
    clearTimeout(timeout);
  }
  const 订阅内容 = await ADD(newapi + 异常订阅);
  return [订阅内容, 订阅转换URLs];
}

async function getUrl(request, targetUrl, 追加UA, userAgentHeader) {
  const newHeaders = new Headers(request.headers);
  newHeaders.set("User-Agent", `${atob('djJyYXlOLzYuNDU=')} cmliu/CF-Workers-SUB ${追加UA}(${userAgentHeader})`);
  const modifiedRequest = new Request(targetUrl, {
    method: request.method,
    headers: newHeaders,
    body: request.method === "GET" ? null : request.body,
    redirect: "follow",
    cf: {
      insecureSkipVerify: true,
      allowUntrusted: true,
      validateCertificate: false
    }
  });
  console.log(`请求URL: ${targetUrl}`);
  console.log(`请求头: ${JSON.stringify([...newHeaders])}`);
  console.log(`请求方法: ${request.method}`);
  return fetch(modifiedRequest);
}

function isValidBase64(str) {
  const cleanStr = str.replace(/\s/g, '');
  const base64Regex = /^[A-Za-z0-9+/=]+$/;
  return base64Regex.test(cleanStr);
}

async function 迁移地址列表(env, txt = 'LINK.txt') {
  const 旧数据 = await env.KV.get(`/${txt}`);
  const 新数据 = await env.KV.get(txt);
  if (旧数据 && !新数据) {
    await env.KV.put(txt, 旧数据);
    await env.KV.delete(`/${txt}`);
    return true;
  }
  return false;
}

async function KV(request, env, txt = 'LINK.txt', guest) {
  const url = new URL(request.url);
  try {
    if (request.method === "POST") {
      if (!env.KV) return new Response("未绑定KV空间", { status: 400 });
      try {
        const content = await request.text();
        await env.KV.put(txt, content);
        return new Response("保存成功");
      } catch (error) {
        console.error('保存KV时发生错误:', error);
        return new Response("保存失败: " + error.message, { status: 500 });
      }
    }
    let content = '';
    let hasKV = !!env.KV;
    if (hasKV) {
      try {
        content = await env.KV.get(txt) || '';
      } catch (error) {
        console.error('读取KV时发生错误:', error);
        content = '读取数据时发生错误: ' + error.message;
      }
    }
    const html = `
<!DOCTYPE html>
<html>
<head>
<title>${FileName} 订阅编辑</title>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
body {
margin: 0;
padding: 15px;
box-sizing: border-box;
font-size: 13px;
}
.editor-container {
width: 100%;
max-width: 100%;
margin: 0 auto;
}
.editor {
width: 100%;
height: 300px;
margin: 15px 0;
padding: 10px;
box-sizing: border-box;
border: 1px solid #ccc;
border-radius: 4px;
font-size: 13px;
line-height: 1.5;
overflow-y: auto;
resize: none;
}
.save-container {
margin-top: 8px;
display: flex;
align-items: center;
gap: 10px;
}
.save-btn, .back-btn {
padding: 6px 15px;
color: white;
border: none;
border-radius: 4px;
cursor: pointer;
}
.save-btn {
background: #4CAF50;
}
.save-btn:hover {
background: #45a049;
}
.back-btn {
background: #666;
}
.back-btn:hover {
background: #555;
}
.save-status {
color: #666;
}
</style>
<script src="https://cdn.jsdelivr.net/npm/@keeex/qrcodejs-kx@1.0.2/qrcode.min.js"></script>
</head>
<body>
################################################################<br>
Subscribe / sub 订阅地址, 点击链接自动 <strong>复制订阅链接</strong> 并 <strong>生成订阅二维码</strong> <br>
---------------------------------------------------------------<br>
自适应订阅地址:<br>
<a href="javascript:void(0)" onclick="copyToClipboard('https://${url.hostname}/${mytoken}?sub','qrcode_0')" style="color:blue;text-decoration:underline;cursor:pointer;">https://${url.hostname}/${mytoken}</a><br>
<div id="qrcode_0" style="margin: 10px 10px 10px 10px;"></div>
Base64订阅地址:<br>
<a href="javascript:void(0)" onclick="copyToClipboard('https://${url.hostname}/${mytoken}?b64','qrcode_1')" style="color:blue;text-decoration:underline;cursor:pointer;">https://${url.hostname}/${mytoken}?b64</a><br>
<div id="qrcode_1" style="margin: 10px 10px 10px 10px;"></div>
clash订阅地址:<br>
<a href="javascript:void(0)" onclick="copyToClipboard('https://${url.hostname}/${mytoken}?clash','qrcode_2')" style="color:blue;text-decoration:underline;cursor:pointer;">https://${url.hostname}/${mytoken}?clash</a><br>
<div id="qrcode_2" style="margin: 10px 10px 10px 10px;"></div>
singbox订阅地址:<br>
<a href="javascript:void(0)" onclick="copyToClipboard('https://${url.hostname}/${mytoken}?sb','qrcode_3')" style="color:blue;text-decoration:underline;cursor:pointer;">https://${url.hostname}/${mytoken}?sb</a><br>
<div id="qrcode_3" style="margin: 10px 10px 10px 10px;"></div>
surge订阅地址:<br>
<a href="javascript:void(0)" onclick="copyToClipboard('https://${url.hostname}/${mytoken}?surge','qrcode_4')" style="color:blue;text-decoration:underline;cursor:pointer;">https://${url.hostname}/${mytoken}?surge</a><br>
<div id="qrcode_4" style="margin: 10px 10px 10px 10px;"></div>
loon订阅地址:<br>
<a href="javascript:void(0)" onclick="copyToClipboard('https://${url.hostname}/${mytoken}?loon','qrcode_5')" style="color:blue;text-decoration:underline;cursor:pointer;">https://${url.hostname}/${mytoken}?loon</a><br>
<div id="qrcode_5" style="margin: 10px 10px 10px 10px;"></div>
&nbsp;&nbsp;<strong><a href="javascript:void(0);" id="noticeToggle" onclick="toggleNotice()">查看访客订阅∨</a></strong><br>
<div id="noticeContent" class="notice-content" style="display: none;">
---------------------------------------------------------------<br>
访客订阅只能使用订阅功能，无法查看配置页！<br>
GUEST（访客订阅TOKEN）: <strong>${guest}</strong><br>
---------------------------------------------------------------<br>
自适应订阅地址:<br>
<a href="javascript:void(0)" onclick="copyToClipboard('https://${url.hostname}/sub?token=${guest}','guest_0')" style="color:blue;text-decoration:underline;cursor:pointer;">https://${url.hostname}/sub?token=${guest}</a><br>
<div id="guest_0" style="margin: 10px 10px 10px 10px;"></div>
Base64订阅地址:<br>
<a href="javascript:void(0)" onclick="copyToClipboard('https://${url.hostname}/sub?token=${guest}&b64','guest_1')" style="color:blue;text-decoration:underline;cursor:pointer;">https://${url.hostname}/sub?token=${guest}&b64</a><br>
<div id="guest_1" style="margin: 10px 10px 10px 10px;"></div>
clash订阅地址:<br>
<a href="javascript:void(0)" onclick="copyToClipboard('https://${url.hostname}/sub?token=${guest}&clash','guest_2')" style="color:blue;text-decoration:underline;cursor:pointer;">https://${url.hostname}/sub?token=${guest}&clash</a><br>
<div id="guest_2" style="margin: 10px 10px 10px 10px;"></div>
singbox订阅地址:<br>
<a href="javascript:void(0)" onclick="copyToClipboard('https://${url.hostname}/sub?token=${guest}&sb','guest_3')" style="color:blue;text-decoration:underline;cursor:pointer;">https://${url.hostname}/sub?token=${guest}&sb</a><br>
<div id="guest_3" style="margin: 10px 10px 10px 10px;"></div>
surge订阅地址:<br>
<a href="javascript:void(0)" onclick="copyToClipboard('https://${url.hostname}/sub?token=${guest}&surge','guest_4')" style="color:blue;text-decoration:underline;cursor:pointer;">https://${url.hostname}/sub?token=${guest}&surge</a><br>
<div id="guest_4" style="margin: 10px 10px 10px 10px;"></div>
loon订阅地址:<br>
<a href="javascript:void(0)" onclick="copyToClipboard('https://${url.hostname}/sub?token=${guest}&loon','guest_5')" style="color:blue;text-decoration:underline;cursor:pointer;">https://${url.hostname}/sub?token=${guest}&loon</a><br>
<div id="guest_5" style="margin: 10px 10px 10px 10px;"></div>
</div>
---------------------------------------------------------------<br>
################################################################<br>
订阅转换配置<br>
---------------------------------------------------------------<br>
SUBAPI（订阅转换后端）: <strong>${subProtocol}://${subConverter}</strong><br>
SUBCONFIG（订阅转换配置文件）: <strong>${subConfig}</strong><br>
---------------------------------------------------------------<br>
################################################################<br>
${FileName} 汇聚订阅编辑:
<div class="editor-container">
${hasKV ? `
<textarea class="editor"
placeholder="${decodeURIComponent(atob('TElOSyVFNyVBNCVCQSVFNCVCRSU4QiVFRiVCQyU4OCVFNCVCOCU4MCVFOCVBMSU4QyVFNCVCOCU4MCVFNCVCOCVBQSVFOCU4QSU4MiVFNyU4MiVCOSVFOSU5MyVCRSVFNiU4RSVBNSVFNSU4RCVCMyVFNSU4RiVBRiVFRiVCQyU4OSVFRiVCQyU5QQp2bGVzcyUzQSUyRiUyRjI0NmFhNzk1LTA2MzctNGY0Yy04ZjY0LTJjOGZiMjRjMWJhZCU0MDEyNy4wLjAuMSUzQTEyMzQlM0ZlbmNyeXB0aW9uJTNEbm9uZSUyNnNlY3VyaXR5JTNEdGxzJTI2c25pJTNEVEcuQ01MaXVzc3NzLmxvc2V5b3VyaXAuY29tJTI2YWxsb3dJbnNlY3VyZSUzRDElMjZ0eXBlJTNEd3MlMjZob3N0JTNEVEcuQ01MaXVzc3NzLmxvc2V5b3VyaXAuY29tJTI2cGF0aCUzRCUyNTJGJTI1M0ZlZCUyNTNEMjU2MCUyM0NGbmF0CnRyb2phbiUzQSUyRiUyRmFhNmRkZDJmLWQxY2YtNGE1Mi1iYTFiLTI2NDBjNDFhNzg1NiU0MDIxOC4xOTAuMjMwLjIwNyUzQTQxMjg4JTNGc2VjdXJpdHklM0R0bHMlMjZzbmklM0RoazEyLmJpbGliaWxpLmNvbSUyNmFsbG93SW5zZWN1cmUlM0QxJTI2dHlwZSUzRHRjcCUyNmhlYWRlclR5cGUlM0Rub25lJTIzSEsKc3MlM0ElMkYlMkZZMmhoWTJoaE1qQXRhV1YwWmkxd2IyeDVNVE13TlRveVJYUlFjVzQyU0ZscVZVNWpTRzlvVEdaVmNFWlJkMjVtYWtORFVUVnRhREZ0U21SRlRVTkNkV04xVjFvNVVERjFaR3RTUzBodVZuaDFielUxYXpGTFdIb3lSbTgyYW5KbmRERTRWelkyYjNCMGVURmxOR0p0TVdwNlprTm1RbUklMjUzRCU0MDg0LjE5LjMxLjYzJTNBNTA4NDElMjNERQoKCiVFOCVBRSVBMiVFOSU5OCU4NSVFOSU5MyVCRSVFNiU4RSVBNSVFNyVBNCVCQSVFNCVCRSU4QiVFRiVCQyU4OCVFNCVCOCU4MCVFOCVBMSU4QyVFNCVCOCU4MCVFNiU5RCVBMSVFOCVBRSVBMiVFOSU5OCU4NSVFOSU5MyVCRSVFNiU4RSVBNSVFNSU4RCVCMyVFNSU4RiVBRiVFRiVCQyU4OSVFRiVCQyU5QQpodHRwcyUzQSUyRiUyRnN1Yi54Zi5mcmVlLmhyJTJGYXV0bw=='))}"
id="content">${content}</textarea>
<div class="save-container">
<button class="save-btn" onclick="saveContent(this)">保存</button>
<span class="save-status" id="saveStatus"></span>
</div>
` : '<p>请绑定 <strong>变量名称</strong> 为 <strong>KV</strong> 的KV命名空间</p>'}
</div>
<br>
################################################################<br>
${decodeURIComponent(atob('dGVsZWdyYW0lMjAlRTQlQkElQTQlRTYlQjUlODElRTclQkUlQTQlMjAlRTYlOEElODAlRTYlOUMlQUYlRTUlQTQlQTclRTQlQkQlQUMlN0UlRTUlOUMlQTglRTclQkElQkYlRTUlOEYlOTElRTclODklOEMhJTNDYnIlM0UKJTNDYSUyMGhyZWYlM0QlMjdodHRwcyUzQSUyRiUyRnQubWUlMkZDTUxpdXNzc3MlMjclM0VodHRwcyUzQSUyRiUyRnQubWUlMkZDTUxpdXNzc3MlM0MlMkZhJTNFJTNDYnIlM0UKLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tJTNDYnIlM0UKZ2l0aHViJTIwJUU5JUExJUI5JUU3JTlCJUFFJUU1JTlDJUIwJUU1JTlEJTgwJTIwU3RhciFTdGFyIVN0YXIhISElM0NiciUzRQolM0NhJTIwaHJlZiUzRCUyN2h0dHBzJTNBJTJGJTJGZ2l0aHViLmNvbSUyRmNtbGl1JTJGQ0YtV29ya2Vycy1TVUIlMjclM0VodHRwcyUzQSUyRiUyRmdpdGh1Yi5jb20lMkZjbWxpdSUyRkNGLVdvcmtlcnMtU1VCJTNDJTJGYSUzRSUzQ2JyJTNFCi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSUzQ2JyJTNFCiUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUwQQ=='))}
<br><br>UA: <strong>${request.headers.get('User-Agent')}</strong>
<script>
function copyToClipboard(text, qrcode) {
navigator.clipboard.writeText(text).then(() => {
alert('已复制到剪贴板');
}).catch(err => {
console.error('复制失败:', err);
});
const qrcodeDiv = document.getElementById(qrcode);
qrcodeDiv.innerHTML = '';
new QRCode(qrcodeDiv, {
text: text,
width: 220,
height: 220,
colorDark: "#000000",
colorLight: "#ffffff",
correctLevel: QRCode.CorrectLevel.Q,
scale: 1
});
}
if (document.querySelector('.editor')) {
let timer;
const textarea = document.getElementById('content');
const originalContent = textarea.value;
function goBack() {
const currentUrl = window.location.href;
const parentUrl = currentUrl.substring(0, currentUrl.lastIndexOf('/'));
window.location.href = parentUrl;
}
function replaceFullwidthColon() {
const text = textarea.value;
textarea.value = text.replace(/：/g, ':');
}
function saveContent(button) {
try {
const updateButtonText = (step) => {
button.textContent = \`保存中: \${step}\`;
};
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
if (!isIOS) {
replaceFullwidthColon();
}
updateButtonText('开始保存');
button.disabled = true;
const textarea = document.getElementById('content');
if (!textarea) {
throw new Error('找不到文本编辑区域');
}
updateButtonText('获取内容');
let newContent;
let originalContent;
try {
newContent = textarea.value || '';
originalContent = textarea.defaultValue || '';
} catch (e) {
console.error('获取内容错误:', e);
throw new Error('无法获取编辑内容');
}
updateButtonText('准备状态更新函数');
const updateStatus = (message, isError = false) => {
const statusElem = document.getElementById('saveStatus');
if (statusElem) {
statusElem.textContent = message;
statusElem.style.color = isError ? 'red' : '#666';
}
};
updateButtonText('准备按钮重置函数');
const resetButton = () => {
button.textContent = '保存';
button.disabled = false;
};
if (newContent !== originalContent) {
updateButtonText('发送保存请求');
fetch(window.location.href, {
method: 'POST',
body: newContent,
headers: {
'Content-Type': 'text/plain;charset=UTF-8'
},
cache: 'no-cache'
})
.then(response => {
updateButtonText('检查响应状态');
if (!response.ok) {
throw new Error(\`HTTP error! status: \${response.status}\`);
}
updateButtonText('更新保存状态');
const now = new Date().toLocaleString();
document.title = \`编辑已保存 \${now}\`;
updateStatus(\`已保存 \${now}\`);
})
.catch(error => {
updateButtonText('处理错误');
console.error('Save error:', error);
updateStatus(\`保存失败: \${error.message}\`, true);
})
.finally(() => {
resetButton();
});
} else {
updateButtonText('检查内容变化');
updateStatus('内容未变化');
resetButton();
}
} catch (error) {
console.error('保存过程出错:', error);
button.textContent = '保存';
button.disabled = false;
const statusElem = document.getElementById('saveStatus');
if (statusElem) {
statusElem.textContent = \`错误: \${error.message}\`;
statusElem.style.color = 'red';
}
}
}
textarea.addEventListener('blur', saveContent);
textarea.addEventListener('input', () => {
clearTimeout(timer);
timer = setTimeout(saveContent, 5000);
});
}
function toggleNotice() {
const noticeContent = document.getElementById('noticeContent');
const noticeToggle = document.getElementById('noticeToggle');
if (noticeContent.style.display === 'none' || noticeContent.style.display === '') {
noticeContent.style.display = 'block';
noticeToggle.textContent = '隐藏访客订阅∧';
} else {
noticeContent.style.display = 'none';
noticeToggle.textContent = '查看访客订阅∨';
}
}
document.addEventListener('DOMContentLoaded', () => {
document.getElementById('noticeContent').style.display = 'none';
});
</script>
</body>
</html>
`;
    return new Response(html, {
      headers: { "Content-Type": "text/html;charset=utf-8" }
    });
  } catch (error) {
    console.error('处理请求时发生错误:', error);
    return new Response("服务器错误: " + error.message, {
      status: 500,
      headers: { "Content-Type": "text/plain;charset=utf-8" }
    });
  }
}

function computeDiff(oldData, newData) {
  const oldLines = oldData.split('\n');
  const newLines = newData.split('\n');
  let added = newLines.filter(line => !oldLines.includes(line)).join(', ');
  let removed = oldLines.filter(line => !newLines.includes(line)).join(', ');
  if (!added && !removed) return '';
  return `Added: ${added || 'none'} | Removed: ${removed || 'none'}`;
}

function getEnhancedClashConfig() {
  return `
dns:
  enable: true
  ipv6: false
  enhanced-mode: fake-ip
  fake-ip-range: 198.18.0.1/16
  use-hosts: true
  nameserver:
    - https://dns.google/dns-query
    - https://cloudflare-dns.com/dns-query
  fallback:
    - tls://1.1.1.1
  fallback-filter:
    geoip: true
    ipcidr:
      - 240.0.0.0/4
  fake-ip-filter:
    - '*.lan'
    - localhost
    - '*.msftncsi.com'

rules:
  - DOMAIN-SUFFIX,google.com,PROXY
  - GEOIP,CN,DIRECT
  - MATCH,REJECT  # 最终匹配拒绝（断网）

proxy-groups:
  - name: "养号组"
    type: fallback
    proxies: [proxy1, proxy2]  # 替换为你的节点名
    url: http://www.gstatic.com/generate_204
    interval: 300
    tolerance: 50
    lazy: true
    fallback: REJECT  # 全死即断网，无DIRECT

tun:
  enable: true
  stack: system
  dns-hijack:
    - any:53

sniffer:
  enable: true
  sniff:
    - tls
    - http

experimental:
  auto-update: true
  core-url: https://github.com/MetaCubeX/mihomo/releases/download/alpha-smart-g3c0a1d4/mihomo-alpha-smart-g3c0a1d4  # 最新Meta内核
  check-current-version: true

external-controller: 127.0.0.1:9090
secret: ''
log-level: info
  `;
}
