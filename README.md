## Cloudflare Page 部署简单记事本
### 功能：在线添加/编辑/删除内容记录，网页以markdown风格渲染内容
工作原理：静态网页 + `KV`保存内容

克隆仓库，部署到Cloudflare Page，
构建目录：`public`  

添加变量：  
`ADMIN_USER`  自定义用户名  
`ADMIN_PASS`  自定义用户密码  

创建一个自定义名称的 `KV`  
将变量`NOTES_KV`绑定到 `KV`
