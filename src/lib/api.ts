const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
import { toast } from 'sonner';

// 后端API基础URL - 请替换为您的实际后端API地址
// 重要：部署前必须修改为您的后端Vercel地址
// 示例：const API_BASE_URL = 'https://your-backend-api.vercel.app/api';
const API_BASE_URL = 'https://33rd-delta.vercel.app/'; // 为空时直接使用本地存储

// 请求包装器，处理错误和认证
const apiRequest = async (endpoint: string, options: globalThis.RequestInit = {}) => {
  // 从localStorage获取token
  const authData = localStorage.getItem('auth');
  const token = authData ? JSON.parse(authData).token : null;
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
  
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers
    });
    
    if (!response.ok) {
      // 在开发环境下，如果API请求失败，回退到本地存储数据
      if (process.env.NODE_ENV !== 'production') {
        console.warn('API请求失败，回退到本地存储数据');
        return null; // 触发本地存储数据加载
      }
      throw new Error(`API请求失败: ${response.status}`);
    }
    
    return response.json();
  } catch (error) {
    console.error('API请求错误:', error);
    toast.error('网络请求失败，请稍后重试');
    throw error;
  }
};

// 认证相关API
export const authAPI = {
  login: async (role: string, username: string, password: string) => {
    try {
      const response = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ role, username, password })
      });
      
      // 如果API请求失败（返回null），使用本地模拟登录
      if (!response) {
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
          // 保存认证信息到本地存储
          const userData = {
            id: `user_${Date.now()}`,
            username,
            name: username,
            role
          };
          
          localStorage.setItem('auth', JSON.stringify(userData));
          
          return {
            success: true,
            user: userData
          };
        }
      }
      
      // 保存token到localStorage
      if (response?.token) {
        localStorage.setItem('auth', JSON.stringify({
          ...response.user,
          token: response.token
        }));
      }
      
      return response;
    } catch (error) {
      console.error('登录失败:', error);
      toast.error('登录失败，请检查用户名和密码');
      throw error;
    }
  },
  
  logout: () => {
    localStorage.removeItem('auth');
  }
};

// 产品相关API
export const productAPI = {
  getAll: async () => {
    try {
      // 尝试从API获取数据
      const response = await apiRequest('/products');
      // 如果API请求失败或没有数据，从本地存储获取
      if (!response) {
        const storedProducts = localStorage.getItem('products');
        return storedProducts ? JSON.parse(storedProducts) : [];
      }
      return response;
    } catch (error) {
      // 出错时从本地存储获取数据
      const storedProducts = localStorage.getItem('products');
      return storedProducts ? JSON.parse(storedProducts) : [];
    }
  },
  
  create: async (product: any) => {
    return apiRequest('/products', {
      method: 'POST',
      body: JSON.stringify(product)
    });
  },
  
  update: async (id: string, product: any) => {
    return apiRequest(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(product)
    });
  },
  
  delete: async (id: string) => {
    return apiRequest(`/products/${id}`, {
      method: 'DELETE'
    });
  },
  
  approve: async (id: string) => {
    return apiRequest(`/products/${id}/approve`, {
      method: 'POST'
    });
  }
};

// 订单相关API
export const orderAPI = {
  getAll: async () => {
    try {
      // 尝试从API获取数据
      const response = await apiRequest('/orders');
      // 如果API请求失败或没有数据，从本地存储获取
      if (!response) {
        const storedOrders = localStorage.getItem('orders');
        return storedOrders ? JSON.parse(storedOrders) : [];
      }
      return response;
    } catch (error) {
      // 出错时从本地存储获取数据
      const storedOrders = localStorage.getItem('orders');
      return storedOrders ? JSON.parse(storedOrders) : [];
    }
  },
  
  getById: async (id: string) => {
    return apiRequest(`/orders/${id}`);
  },
  
  create: async (order: any) => {
    return apiRequest('/orders', {
      method: 'POST',
      body: JSON.stringify(order)
    });
  },
  
  update: async (id: string, order: any) => {
    return apiRequest(`/orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(order)
    });
  },
  
  updateStatus: async (id: string, status: string) => {
    return apiRequest(`/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  }
};

// 客户相关API
export const customerAPI = {
  getAll: async () => {
    try {
      // 尝试从API获取数据
      const response = await apiRequest('/customers');
      // 如果API请求失败或没有数据，从本地存储获取
      if (!response) {
        const storedCustomers = localStorage.getItem('customers');
        return storedCustomers ? JSON.parse(storedCustomers) : [];
      }
      return response;
    } catch (error) {
      // 出错时从本地存储获取数据
      const storedCustomers = localStorage.getItem('customers');
      return storedCustomers ? JSON.parse(storedCustomers) : [];
    }
  },
  
  create: async (customer: any) => {
    return apiRequest('/customers', {
      method: 'POST',
      body: JSON.stringify(customer)
    });
  },
  
  update: async (id: string, customer: any) => {
    return apiRequest(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(customer)
    });
  },
  
  delete: async (id: string) => {
    return apiRequest(`/customers/${id}`, {
      method: 'DELETE'
    });
  }
};

// 业务员相关API（管理员使用）
export const salespersonAPI = {
  getAll: async () => {
    try {
      // 尝试从API获取数据
      const response = await apiRequest('/salespersons');
      // 如果API请求失败或没有数据，从本地存储获取
      if (!response) {
        const storedSalespersons = localStorage.getItem('salespersons');
        return storedSalespersons ? JSON.parse(storedSalespersons) : [];
      }
      return response;
    } catch (error) {
      // 出错时从本地存储获取数据
      const storedSalespersons = localStorage.getItem('salespersons');
      return storedSalespersons ? JSON.parse(storedSalespersons) : [];
    }
  },
  
  create: async (salesperson: any) => {
    return apiRequest('/salespersons', {
      method: 'POST',
      body: JSON.stringify(salesperson)
    });
  },
  
  update: async (id: string, salesperson: any) => {
    return apiRequest(`/salespersons/${id}`, {
      method: 'PUT',
      body: JSON.stringify(salesperson)
    });
  },
  
  delete: async (id: string) => {
    return apiRequest(`/salespersons/${id}`, {
      method: 'DELETE'
    });
  }
};

// 导出所有API
export default {
  auth: authAPI,
  products: productAPI,
  orders: orderAPI,
  customers: customerAPI,
  salespersons: salespersonAPI
};
