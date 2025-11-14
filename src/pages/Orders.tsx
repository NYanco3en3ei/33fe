import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '@/contexts/authContext';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

// 产品类型
interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  createdAt: string;
}

// 客户类型
interface Customer {
  id: string;
  name: string;
  address: string;
  contact: string;
  phone: string;
  createdAt: string;
}

// 订单项类型
interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  originalPrice?: number; // 原始价格
}

// 订单状态类型
type OrderStatus = 'pending' | 'approved' | 'shipped' | 'delivered' | 'cancelled';

// 订单类型
interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerAddress: string;
  products: OrderItem[];
  totalAmount: number;
  deliveryDate: string;
  status: OrderStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

const Orders = () => {
  const { userRole, userName } = useContext(AuthContext);
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [searchType, setSearchType] = useState<'salesperson' | 'customer'>('salesperson');
  const [searchValue, setSearchValue] = useState('');
  const [formData, setFormData] = useState({
    customerId: '',
    customerAddress: '', // 手动输入的地址
    selectedProducts: [] as { productId: string; quantity: number; unitPrice?: number }[],
    deliveryDate: ''
  });

  // 加载数据
  useEffect(() => {
    loadData();
  }, [userRole, userName]);

  // 搜索效果
  useEffect(() => {
    filterOrders();
  }, [orders, searchType, searchValue]);

  const loadData = () => {
    setLoading(true);
    try {
      // 加载订单
      const storedOrders = localStorage.getItem('orders');
      if (storedOrders) {
        let parsedOrders: Order[] = JSON.parse(storedOrders);
        
        // 根据用户角色筛选订单
        if (userRole === 'salesperson') {
          parsedOrders = parsedOrders.filter(order => order.createdBy === userName);
        }
        
        setOrders(parsedOrders);
      }
      
      // 加载产品
      const storedProducts = localStorage.getItem('products');
      if (storedProducts) {
        setProducts(JSON.parse(storedProducts));
      }
      
      // 加载客户
      const storedCustomers = localStorage.getItem('customers');
      if (storedCustomers) {
        setCustomers(JSON.parse(storedCustomers));
      }
    } catch (error) {
      toast.error('加载数据失败');
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 过滤订单
  const filterOrders = () => {
    if (!searchValue.trim()) {
      setFilteredOrders(orders);
      return;
    }

    const filtered = orders.filter(order => {
      if (searchType === 'salesperson') {
        return order.createdBy.toLowerCase().includes(searchValue.toLowerCase());
      } else {
        return order.customerName.toLowerCase().includes(searchValue.toLowerCase());
      }
    });

    setFilteredOrders(filtered);
  };

  // 打开创建订单模态框
  const openCreateModal = () => {
    setFormData({
      customerId: '',
      customerAddress: '',
      selectedProducts: [],
      deliveryDate: ''
    });
    setShowModal(true);
  };

  // 当客户选择改变时，自动填充地址但允许修改
  useEffect(() => {
    if (formData.customerId && !formData.customerAddress) {
      const selectedCustomer = customers.find(customer => customer.id === formData.customerId);
      if (selectedCustomer) {
        setFormData(prev => ({
          ...prev,
          customerAddress: selectedCustomer.address
        }));
      }
    }
  }, [formData.customerId, customers, formData.customerAddress]);

  // 打开订单详情模态框
  const openDetailModal = (order: Order) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
  };

  // 打开删除确认模态框
  const openDeleteModal = (orderId: string) => {
    setOrderToDelete(orderId);
    setDeletePassword('');
    setShowDeleteModal(true);
  };

  // 关闭模态框
  const closeModal = () => {
    setShowModal(false);
    setShowDetailModal(false);
    setShowDeleteModal(false);
    setSelectedOrder(null);
    setOrderToDelete(null);
  };

  // 处理表单变化
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 添加产品到订单
  const addProductToOrder = (productId: string) => {
    const existingProduct = formData.selectedProducts.find(item => item.productId === productId);
    if (existingProduct) return;
    
    // 获取产品的原始价格
    const product = products.find(p => p.id === productId);
    const unitPrice = product ? product.price : 0;
    
    setFormData(prev => ({
      ...prev,
      selectedProducts: [...prev.selectedProducts, { productId, quantity: 1, unitPrice }]
    }));
  };

  // 更新产品数量
  const updateProductQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) return;
    
    setFormData(prev => ({
      ...prev,
      selectedProducts: prev.selectedProducts.map(item => 
        item.productId === productId ? { ...item, quantity } : item
      )
    }));
  };

  // 更新产品单价
  const updateProductPrice = (productId: string, price: number) => {
    if (price < 0) return;
    
    setFormData(prev => ({
      ...prev,
      selectedProducts: prev.selectedProducts.map(item => 
        item.productId === productId ? { ...item, unitPrice: price } : item
      )
    }));
  };

  // 从订单中移除产品
  const removeProductFromOrder = (productId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedProducts: prev.selectedProducts.filter(item => item.productId !== productId)
    }));
  };

  // 创建订单
  const createOrder = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 表单验证
    if (!formData.customerId || formData.selectedProducts.length === 0 || !formData.deliveryDate) {
      toast.error('请填写完整的订单信息');
      return;
    }

    try {
      // 查找客户信息
      const selectedCustomer = customers.find(customer => customer.id === formData.customerId);
      if (!selectedCustomer) {
        toast.error('客户信息不存在');
        return;
      }
      
      // 构建订单项
      const orderItems: OrderItem[] = formData.selectedProducts.map(item => {
        const product = products.find(p => p.id === item.productId);
        if (!product) throw new Error('产品信息不存在');
        
        // 检查是否自定义了价格
        const hasCustomPrice = item.unitPrice !== undefined && item.unitPrice !== product.price;
        
        return {
          productId: item.productId,
          productName: product.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice || product.price,
          ...(hasCustomPrice && { originalPrice: product.price })
        };
      });
      
      // 计算总金额
      const totalAmount = orderItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
      
      // 创建新订单
      const newOrder: Order = {
        id: Date.now().toString(),
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.name,
        customerAddress: formData.customerAddress || selectedCustomer.address,
        products: orderItems,
        totalAmount,
        deliveryDate: formData.deliveryDate,
        status: 'pending',
        createdBy: userName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // 保存到本地存储
      const updatedOrders = [...orders, newOrder];
      localStorage.setItem('orders', JSON.stringify(updatedOrders));
      setOrders(updatedOrders);
      
      // 通知管理员有新订单
      if (userRole === 'salesperson') {
        // 这里可以实现新订单提醒逻辑
        toast.success('订单创建成功，等待管理员审核');
      } else {
        toast.success('订单创建成功');
      }
      
      closeModal();
    } catch (error) {
      toast.error('创建订单失败');
      console.error('创建订单失败:', error);
    }
  };

  // 更新订单状态
  const updateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    try {
      const updatedOrders = orders.map(order =>order.id === orderId 
          ? { ...order, status: newStatus, updatedAt: new Date().toISOString() } 
          : order
      );
      
      localStorage.setItem('orders', JSON.stringify(updatedOrders));
      setOrders(updatedOrders);
      
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus, updatedAt: new Date().toISOString() });
      }
      
      toast.success('订单状态已更新');
    } catch (error) {
      toast.error('更新订单状态失败');
      console.error('更新订单状态失败:', error);
    }
  };

  // 删除订单（需要密码确认）
  const deleteOrder = () => {
    if (!orderToDelete) return;

    // 检查密码（在实际应用中应该从后端验证）
    // 这里为了演示，我们假设默认管理员密码是 'password'
    if (deletePassword !== 'password') {
      toast.error('密码错误，无法删除订单');
      return;
    }

    try {
      const updatedOrders = orders.filter(order => order.id !== orderToDelete);
      localStorage.setItem('orders', JSON.stringify(updatedOrders));
      setOrders(updatedOrders);
      closeModal();
      toast.success('订单已删除');
    } catch (error) {
      toast.error('删除订单失败');
      console.error('删除订单失败:', error);
    }
  };

  // 导出订单为Excel
  const exportToExcel = () => {
    // 这里简化实现，实际项目中可以使用更复杂的Excel导出库
    try {
      let csvContent = "订单编号,客户名称,客户地址,总金额,发货日期,状态,创建时间\n";
      
      orders.forEach(order => {
        const row = [
          order.id,
          `"${order.customerName}"`,
          `"${order.customerAddress}"`,
          order.totalAmount,
          order.deliveryDate,
          getStatusText(order.status),
          new Date(order.createdAt).toLocaleString()
        ].join(',');
        
        csvContent += row + "\n";
      });
      
      // 创建Blob对象
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      // 设置下载属性
      link.setAttribute('href', url);
      link.setAttribute('download', `订单数据_${new Date().toLocaleDateString()}.csv`);
      link.style.visibility = 'hidden';
      
      // 添加到文档并触发下载
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('订单数据已导出');
    } catch (error) {
      toast.error('导出订单失败');
      console.error('导出订单失败:', error);
    }
  };

  // 获取状态文本
  const getStatusText = (status: OrderStatus): string => {
    const statusMap: Record<OrderStatus, string> = {
      pending: '待审核',
      approved: '已批准',
      shipped: '已发货',
      delivered: '已送达',
      cancelled: '已取消'
    };
    return statusMap[status];
  };

  // 获取状态样式
  const getStatusStyle = (status: OrderStatus): string => {
    const statusStyles: Record<OrderStatus, string> = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      shipped: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      delivered: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
    };
    return statusStyles[status];
  };

  // 格式化价格
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  // 获取选中客户的地址
  const getSelectedCustomerAddress = () => {
    const selectedCustomer = customers.find(customer => customer.id === formData.customerId);
    return selectedCustomer ? selectedCustomer.address : '';
  };

  // 计算订单小计
  const calculateOrderSubtotal = () => {
    return formData.selectedProducts.reduce((sum, item) => {
      const product = products.find(p => p.id === item.productId);
      return sum + (product ? product.price * item.quantity : 0);
    }, 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2 md:mb-0">
          订单管理
        </h1>
        
        <div className="flex flex-col sm:flex-row gap-3">
          {userRole === 'admin' && (
            <button
              onClick={exportToExcel}
              className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
            >
              <i className="fa-solid fa-file-export mr-2"></i>
              导出订单
            </button>
          )}
          
          <button
            onClick={openCreateModal}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
          >
            <i className="fa-solid fa-plus mr-2"></i>
            创建订单
          </button>
        </div>
      </div>
      
      {/* 搜索栏 */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-4">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
          <div className="flex border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden flex-grow">
            <button
              onClick={() => setSearchType('salesperson')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                searchType === 'salesperson' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              业务员
            </button>
            <button
              onClick={() => setSearchType('customer')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                searchType === 'customer' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              客户
            </button>
          </div>
          
          <div className="relative flex-grow">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <i className="fa-solid fa-search"></i>
            </span>
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder={`搜索${searchType === 'salesperson' ? '业务员' : '客户'}订单`}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all outline-none"
            />
          </div>
          
          {searchValue && (
            <button
              onClick={() => setSearchValue('')}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg transition-colors flex items-center justify-center"
            >
              <i className="fa-solid fa-times"></i>
            </button>
          )}
        </div>
        
        {/* 搜索结果统计 */}
        {searchValue && (
          <div className="mt-3 text-sm text-slate-500 dark:text-slate-400">
            找到 {filteredOrders.length} 条{searchType === 'salesperson' ? '业务员' : '客户'}订单记录
          </div>
        )}
      </div>
      
      {/* 订单列表 */}
      {filteredOrders.length > 0 ? (
        <div className="overflow-x-auto bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  订单编号
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  客户名称
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  金额
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  发货日期
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  创建时间
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {filteredOrders.map((order) => (
                <motion.tr 
                  key={order.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-800 dark:text-white">
                    {order.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">
                    {order.customerName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">
                    {formatPrice(order.totalAmount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">
                    {order.deliveryDate}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusStyle(order.status)}`}>
                      {getStatusText(order.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                    {new Date(order.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openDetailModal(order)}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                      >
                        <i className="fa-solid fa-eye mr-1"></i>
                        查看
                      </button>
                      
                      {userRole === 'admin' && (
                        <>
                          <select
                            value={order.status}
                            onChange={(e) => updateOrderStatus(order.id, e.target.value as OrderStatus)}
                            className="text-xs border border-slate-300 dark:border-slate-600 rounded-md p-1 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200"
                          >
                            <option value="pending">待审核</option>
                            <option value="approved">已批准</option>
                            <option value="shipped">已发货</option>
                            <option value="delivered">已送达</option>
                            <option value="cancelled">已取消</option>
                          </select>
                          
                          <button
                            onClick={() => openDeleteModal(order.id)}
                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                          >
                            <i className="fa-solid fa-trash-alt mr-1"></i>
                            删除
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-700 mb-4">
            <i className="fa-solid fa-file-invoice text-2xl text-slate-400 dark:text-slate-500"></i>
          </div>
          <h3 className="text-lg font-medium text-slate-800 dark:text-white mb-2">暂无订单</h3>
          <p className="text-slate-500 dark:text-slate-400 mb-4">
            {searchValue 
              ? `没有找到与"${searchValue}"相关的订单`
              : (userRole === 'admin' ? '暂无订单数据，请等待业务员创建订单' : '您还没有创建任何订单')
            }
          </p>
          
          {!searchValue && (
            <button
              onClick={openCreateModal}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors inline-flex items-center"
            >
              <i className="fa-solid fa-plus mr-2"></i>
              创建订单
            </button>
          )}
        </div>
      )}
      
      {/* 创建订单模态框 */}
      {showModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={closeModal}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-100 dark:border-slate-700">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">创建订单</h2>
            </div>
            
            <form onSubmit={createOrder} className="p-6 space-y-4">
              {/* 客户选择 */}
              <div>
                <label htmlFor="customerId" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  选择客户 <span className="text-red-500">*</span>
                </label>
                <select
                  id="customerId"
                  name="customerId"
                  value={formData.customerId}
                  onChange={handleFormChange}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all outline-none"
                  required
                >
                  <option value="">请选择客户</option>
                  {customers.map(customer => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}
                </select>
              </div>
              
               {/* 客户地址（自动填充但可编辑） */}
              {formData.customerId && (
                <div>
                  <label htmlFor="customerAddress" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    收货地址
                  </label>
                  <textarea
                    id="customerAddress"
                    name="customerAddress"
                    value={formData.customerAddress}
                    onChange={(e) => setFormData(prev => ({ ...prev, customerAddress: e.target.value }))}
                    placeholder="请输入收货地址"
                    rows={2}
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all outline-none resize-none"
                    required
                  />
                </div>
              )}
              
              {/* 产品选择 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                  添加产品 <span className="text-red-500">*</span>
                </label>
                
                {/* 可选产品列表 */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mb-4">
                  {products.map(product => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => addProductToOrder(product.id)}
                      disabled={formData.selectedProducts.some(item => item.productId === product.id)}
                      className={`p-2 border rounded-lg text-left transition-all ${
                        formData.selectedProducts.some(item => item.productId === product.id)
                          ? 'border-blue-300 bg-blue-50 dark:border-blue-900 dark:bg-blue-900/20 cursor-not-allowed'
                          : 'border-slate-200 hover:border-blue-300 hover:bg-blue-50 dark:border-slate-700 dark:hover:border-blue-900 dark:hover:bg-blue-900/20'
                      }`}
                    >
                      <div className="text-xs text-slate-700 dark:text-slate-300">{product.name}</div>
                      <div className="text-xs font-semibold text-blue-600 dark:text-blue-400">{formatPrice(product.price)}</div>
                    </button>
                  ))}
                </div>
                
                {/* 已选产品列表 */}
                {formData.selectedProducts.length > 0 && (
                  <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
                    <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">已选产品</h4>
                    <div className="space-y-2">
                      {formData.selectedProducts.map(item => {
                        const product = products.find(p => p.id === item.productId);
                        if (!product) return null;
                        
                        return (
                            <div key={item.productId} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-700 last:border-0">
                            <div className="flex flex-col">
                              <div className="text-sm text-slate-700 dark:text-slate-300">{product.name}</div>
                              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">原始价格: {formatPrice(product.price)}</div>
                            </div>
                            <div className="flex items-center space-x-3">
                              {/* 数量控制 */}
                              <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-md overflow-hidden mr-2">
                                <button
                                  type="button"
                                  onClick={() => updateProductQuantity(item.productId, item.quantity - 1)}
                                  disabled={item.quantity <= 1}
                                  className="px-2 py-1 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 disabled:opacity-50"
                                >
                                  <i className="fa-solid fa-minus text-xs"></i>
                                </button>
                                <input
                                  type="number"
                                  value={item.quantity}
                                  onChange={(e) => updateProductQuantity(item.productId, parseInt(e.target.value) || 1)}
                                  min="1"
                                  className="w-10 text-center border-x border-slate-200 dark:border-slate-700 bg-transparent text-sm text-slate-700 dark:text-slate-300"
                                />
                                <button
                                  type="button"
                                  onClick={() => updateProductQuantity(item.productId, item.quantity + 1)}
                                  className="px-2 py-1 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                                >
                                  <i className="fa-solid fa-plus text-xs"></i>
                                </button>
                              </div>
                              
                              {/* 自定义价格输入 */}
                              <div className="flex items-center">
                                <span className="text-xs text-slate-500 dark:text-slate-400 mr-1">单价:</span>
                                <input
                                  type="number"
                                  value={item.unitPrice}
                                  onChange={(e) => updateProductPrice(item.productId, parseFloat(e.target.value) || 0)}
                                  min="0"
                                  step="0.01"
                                  className="w-20 px-2 py-1 border border-slate-200 dark:border-slate-700 rounded-md text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800"
                                />
                              </div>
                              
                              {/* 删除按钮 */}
                              <button
                                type="button"
                                onClick={() => removeProductFromOrder(item.productId)}
                                className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 ml-2"
                              >
                                <i className="fa-solid fa-times"></i>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                      
                      {/* 订单小计 */}
                      <div className="flex justify-between py-2 font-medium">
                        <div className="text-slate-700 dark:text-slate-300">小计</div>
                        <div className="text-blue-600 dark:text-blue-400">{formatPrice(calculateOrderSubtotal())}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* 发货日期 */}
              <div>
                <label htmlFor="deliveryDate" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  发货日期 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="deliveryDate"
                  name="deliveryDate"
                  value={formData.deliveryDate}
                  onChange={handleFormChange}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all outline-none"
                  required
                />
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 py-2.5 px-4 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  取消
                </button>
                
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  创建订单
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
      
      {/* 订单详情模态框 */}
      {showDetailModal && selectedOrder && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={closeModal}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">订单详情</h2>
              <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusStyle(selectedOrder.status)}`}>
                {getStatusText(selectedOrder.status)}
              </span>
            </div>
            
            <div className="p-6 space-y-6">
              {/* 订单基本信息 */}
              <div>
                <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3">订单信息</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-500">订单编号</p>
                    <p className="text-sm font-medium text-slate-800 dark:text-white">{selectedOrder.id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-500">创建时间</p>
                    <p className="text-sm text-slate-700 dark:text-slate-300">{new Date(selectedOrder.createdAt).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-500">发货日期</p>
                    <p className="text-sm text-slate-700 dark:text-slate-300">{selectedOrder.deliveryDate}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-500">创建人</p>
                    <p className="text-sm text-slate-700 dark:text-slate-300">{selectedOrder.createdBy}</p>
                  </div>
                </div>
              </div>
              
              {/* 客户信息 */}
              <div>
                <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3">客户信息</h3>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-500">客户名称</p>
                    <p className="text-sm font-medium text-slate-800 dark:text-white">{selectedOrder.customerName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-500">客户地址</p>
                    <p className="text-sm text-slate-700 dark:text-slate-300">{selectedOrder.customerAddress}</p>
                  </div>
                </div>
              </div>
              
              {/* 产品列表 */}
              <div>
                <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3">产品明细</h3>
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
                  <div className="space-y-3">
                    {selectedOrder.products.map((item, index) => (
                         <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-700 last:border-0">
                          <div>
                            <div className="text-sm text-slate-700 dark:text-slate-300">{item.productName}</div>
                            {item.originalPrice && item.originalPrice !== item.unitPrice && (
                              <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                                自定义价格（原价: {formatPrice(item.originalPrice)}）
                              </div>
                            )}
                          </div>
                          <div className="flex items-center space-x-8">
                            <div className="text-sm text-slate-700 dark:text-slate-300">{item.quantity} x {formatPrice(item.unitPrice)}</div>
                            <div className="text-sm font-medium text-slate-800 dark:text-white">{formatPrice(item.quantity * item.unitPrice)}</div>
                          </div>
                        </div>
                    ))}
                    
                    {/* 订单总计 */}
                    <div className="flex justify-between py-2 font-medium">
                      <div className="text-slate-700 dark:text-slate-300">总计</div>
                      <div className="text-xl text-blue-600 dark:text-blue-400">{formatPrice(selectedOrder.totalAmount)}</div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* 订单操作 */}
              {userRole === 'admin' && (
                <div>
                  <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3">订单操作</h3>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-slate-700 dark:text-slate-300">更新状态:</span>
                    <select
                      value={selectedOrder.status}
                      onChange={(e) => updateOrderStatus(selectedOrder.id, e.target.value as OrderStatus)}
                      className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200"
                    >
                      <option value="pending">待审核</option>
                      <option value="approved">已批准</option>
                      <option value="shipped">已发货</option>
                      <option value="delivered">已送达</option>
                      <option value="cancelled">已取消</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-slate-100 dark:border-slate-700 flex justify-center">
              <button
                onClick={closeModal}
                className="py-2.5 px-6 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg transition-colors"
              >
                关闭
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
      
      {/* 删除确认模态框 */}
      {showDeleteModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={closeModal}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-100 dark:border-slate-700">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center">
                <i className="fa-solid fa-exclamation-triangle text-yellow-500 mr-2"></i>
                确认删除
              </h2>
            </div>
            
            <div className="p-6 space-y-4">
              <p className="text-slate-700 dark:text-slate-300">
                您确定要删除此订单吗？此操作不可撤销。
              </p>
              
              <div>
                <label htmlFor="deletePassword" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  请输入管理员密码确认
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <i className="fa-solid fa-lock"></i>
                  </span>
                  <input
                    type="password"
                    id="deletePassword"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    placeholder="输入密码"
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all outline-none"
                    required
                  />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  为防止误操作，删除订单需要管理员密码确认
                </p>
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 py-2.5 px-4 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  取消
                </button>
                
                <button
                  type="button"
                  onClick={deleteOrder}
                  className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  <i className="fa-solid fa-trash-alt mr-1"></i>
                  确认删除
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default Orders;