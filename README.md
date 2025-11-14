# 销售订单管理系统部署指南

## 项目结构说明

这个项目分为前端和后端两部分：
- **前端**：基于React + TypeScript + Tailwind CSS，位于`src/`目录
- **后端**：基于Node.js + Express + MongoDB，位于根目录和`routes/`、`models/`等目录

## 部署前准备工作

### 1. 数据库设置

1. 注册一个[MongoDB Atlas](https://www.mongodb.com/atlas/database)账号
2. 创建一个新的MongoDB集群
3. 获取MongoDB连接字符串（格式：`mongodb+srv://<username>:<password>@cluster0.mongodb.net/<dbname>?retryWrites=true&w=majority`）

### 2. GitHub账号设置

1. 注册[GitHub](https://github.com/)账号
2. 创建两个新的仓库：一个用于前端，一个用于后端

## 第一部分：后端部署到Vercel

### 步骤1：准备后端代码

1. 复制以下文件和目录到您的后端GitHub仓库：
   - `index.js`
   - `routes/`
   - `models/`
   - `middlewares/`
   - `utils/`
   - `.env.example`
   - `vercel.json`
   - `package.json`

2. 将`.env.example`重命名为`.env`并填入您的MongoDB连接字符串

### 步骤2：部署后端到Vercel

1. 登录[Vercel](https://vercel.com/)账号并授权GitHub访问
2. 点击"New Project"按钮
3. 导入您的后端GitHub仓库
4. 在"Environment Variables"部分添加以下环境变量：
   - `MONGODB_URI`: 您的MongoDB连接字符串
   - `JWT_SECRET`: 随机生成的字符串（用于JWT令牌签名）

5. 点击"Deploy"按钮
6. 部署完成后，您将获得一个后端API URL（例如：`https://your-backend-api.vercel.app`）

## 第二部分：前端部署到Vercel

### 步骤1：修改前端API连接

1. 打开`src/lib/api.ts`文件
2. 找到以下代码：
   ```typescript
   // 后端API基础URL - 请替换为您的实际后端API地址
   const API_BASE_URL = 'https://your-backend-api.vercel.app/api';
   ```
3. 将`https://your-backend-api.vercel.app`替换为您实际的后端Vercel URL

### 步骤2：准备前端代码

1. 复制以下文件和目录到您的前端GitHub仓库：
   - `src/`
   - `index.html`
   - `.gitignore`
   - `package.json`
   - `vite.config.ts`
   - `tsconfig.json`
   - 其他配置文件

### 步骤3：部署前端到Vercel

1. 在Vercel上点击"New Project"按钮
2. 导入您的前端GitHub仓库
3. Vercel会自动检测这是一个React + Vite项目，无需额外配置
4. 点击"Deploy"按钮
5. 部署完成后，您将获得一个前端网站URL

## 第三部分：初始化系统

### 步骤1：创建管理员账号

1. 访问您的前端网站URL
2. 点击"管理员"选项卡，使用以下默认管理员账号登录：
   - 用户名：`admin`
   - 密码：`password`（注意：登录后请立即修改密码）

### 步骤2：添加基本数据

1. 登录后，先添加一些客户信息
2. 添加一些产品信息
3. 添加业务员账号（如果需要）
4. 开始创建和管理订单

## 常见问题解决

### 1. 界面样式丢失问题

如果部署后界面只有文字没有样式，请检查：
- 确保`index.html`中正确引入了Tailwind CSS的CDN链接
- 检查是否有JavaScript错误阻止了样式加载

### 2. API连接错误

如果前端无法连接到后端，请检查：
- 确保`src/lib/api.ts`中的API地址正确
- 检查Vercel后端项目的环境变量是否正确配置
- 在浏览器控制台查看网络请求错误信息

### 3. 数据库连接问题

如果后端无法连接到MongoDB，请检查：
- MongoDB Atlas的IP白名单设置（允许所有IP访问：0.0.0.0/0）
- 确保MongoDB连接字符串格式正确
- 检查Vercel环境变量是否正确设置

## 本地开发环境设置

如果您想在本地开发和测试：

### 后端本地开发

1. 克隆后端仓库
2. 运行`npm install`安装依赖
3. 创建`.env`文件并配置环境变量
4. 运行`npm run dev`启动开发服务器

### 前端本地开发

1. 克隆前端仓库
2. 运行`npm install`安装依赖
3. 修改`src/lib/api.ts`中的API地址为本地地址（如`http://localhost:3001/api`）
4. 运行`npm run dev`启动开发服务器

---

祝您部署顺利！如有其他问题，请参考各部分的详细说明或联系技术支持。