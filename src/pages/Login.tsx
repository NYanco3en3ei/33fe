import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '@/contexts/authContext';
import { toast } from 'sonner';
import api from '@/lib/api';

const Login = () => {
  const [role, setRole] = useState<'admin' | 'salesperson'>('salesperson');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { setIsAuthenticated, setUserRole, setUserName } = useContext(AuthContext);
  const navigate = useNavigate();

  // 处理登录
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // 直接使用本地存储进行验证（适用于生产环境演示）
      console.log('尝试本地存储验证');
      
      // 简单的模拟验证逻辑
      let isValid = false;
      if (role === 'admin' && username === 'admin' && password === 'password') {
        isValid = true;
      } else if (role === 'salesperson') {
        // 从localStorage获取业务员账号信息
        const salespersonsData = localStorage.getItem('salespersons');
        if (salespersonsData) {
          const salespersons = JSON.parse(salespersonsData);
          isValid = salespersons.some((s: any) => s.username === username && s.password === password);
        }
      }

      if (isValid) {
        setIsAuthenticated(true);
        setUserRole(role);
        setUserName(username);
        
        // 保存认证信息到本地存储
        localStorage.setItem('auth', JSON.stringify({ role, name: username }));
        
        toast.success(`欢迎，${role === 'admin' ? '管理员' : '业务员'}`);
        navigate('/');
        return;
      }
      
      throw new Error('登录失败');
    } catch (error) {
      toast.error('用户名或密码错误');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-blue-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">销售订单管理系统</h2>
          <p className="text-slate-500 dark:text-slate-400">请登录您的账户</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-6">
          {/* 角色选择 */}
          <div className="grid grid-cols-2 gap-4">
            <label className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all ${
              role === 'salesperson' 
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 dark:border-blue-400' 
                : 'border-slate-200 dark:border-slate-700'
            }`}>
              <input 
                type="radio" 
                name="role" 
                value="salesperson" 
                checked={role === 'salesperson'}
                onChange={() => setRole('salesperson')}
                className="w-5 h-5 text-blue-600 dark:text-blue-400"
              />
              <span className="ml-2 text-slate-700 dark:text-slate-200 font-medium">业务员</span>
            </label>
            
            <label className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all ${
              role === 'admin' 
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 dark:border-blue-400' 
                : 'border-slate-200 dark:border-slate-700'
            }`}>
              <input 
                type="radio" 
                name="role" 
                value="admin" 
                checked={role === 'admin'}
                onChange={() => setRole('admin')}
                className="w-5 h-5 text-blue-600 dark:text-blue-400"
              />
              <span className="ml-2 text-slate-700 dark:text-slate-200 font-medium">管理员</span>
            </label>
          </div>
          
          {/* 用户名 */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              用户名
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <i className="fa-solid fa-user"></i>
              </span>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={role === 'admin' ? '输入管理员用户名' : '输入业务员用户名'}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all outline-none"
                required
              />
            </div>
          </div>
          
          {/* 密码 */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              密码
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <i className="fa-solid fa-lock"></i>
              </span>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="输入密码"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all outline-none"
                required
              />
            </div>
          </div>
          
          {/* 登录按钮 */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-medium rounded-xl transition-all flex items-center justify-center ${
              isLoading ? 'opacity-80 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? (
              <>
                <i className="fa-solid fa-circle-notch fa-spin mr-2"></i>
                登录中...
              </>
            ) : (
              <>
                <i className="fa-solid fa-sign-in-alt mr-2"></i>
                登录
              </>
            )}
          </button>
        </form>
        
        {/* 提示信息 */}
      </div>
    </div>
  );
};

export default Login;