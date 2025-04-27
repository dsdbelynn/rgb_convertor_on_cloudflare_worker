export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // 默认提供 index.html
    if (url.pathname === "/" || url.pathname === "") {
      return await env.ASSETS.fetch(new Request("https://example.com/index.html", request));
    }
    
    // 尝试提供请求的资源
    return await env.ASSETS.fetch(request);
  }
};
