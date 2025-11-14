import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '@/contexts/authContext';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

// 产品类型定义
interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  createdAt: string;
  isPendingApproval?: boolean; // 是否待审核
  createdBy?: string; // 创建者
}

const Products = () => {
  const { userRole, userName } = useContext(AuthContext);
  const [products, setProducts] = useState<Product[]>([]);
  const [pendingProducts, setPendingProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showPendingTab, setShowPendingTab] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    price: 0,
    image: ''
  });

  // 加载产品数据
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = () => {
    setLoading(true);
    try {
      const storedProducts = localStorage.getItem('products');
      if (storedProducts) {
        const allProducts = JSON.parse(storedProducts);
        // 分离已批准和待批准的产品
        const approvedProducts = allProducts.filter((p: Product) => !p.isPendingApproval);
        const pendingProductsList = allProducts.filter((p: Product) => p.isPendingApproval);
        
        // 如果是业务员，只显示自己创建的待批准产品
        const filteredPendingProducts = userRole === 'salesperson' 
          ? pendingProductsList.filter((p: Product) => p.createdBy === userName)
          : pendingProductsList;
        
        setProducts(approvedProducts);
        setPendingProducts(filteredPendingProducts);
      }
    } catch (error) {
      toast.error('加载产品数据失败');
      console.error('加载产品数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 打开新增/编辑模态框
  const openModal = (product: Product | null = null) => {
    setEditingProduct(product);
    if (product) {
      setFormData({
        name: product.name,
        price: product.price,
        image: product.image
      });
    } else {
      setFormData({
        name: '',
        price: 0,
        image: ''
      });
    }
    setShowModal(true);
  };

  // 关闭模态框
  const closeModal = () => {
    setShowModal(false);
    setEditingProduct(null);
  };

  // 处理表单变化
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  // 保存产品
  const saveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 表单验证
    if (!formData.name.trim() || formData.price <= 0) {
      toast.error('请填写有效的产品信息');
      return;
    }

    try {
      // 获取所有产品（包括待审核的）
      const storedProducts = localStorage.getItem('products');
      const allProducts = storedProducts ? JSON.parse(storedProducts) : [];
      
      let updatedProducts;
      
      if (editingProduct) {
        // 编辑现有产品
        updatedProducts = allProducts.map((product: Product) => 
          product.id === editingProduct.id 
            ? { ...product, ...formData, updatedAt: new Date().toISOString() } 
            : product
        );
        toast.success('产品更新成功');
      } else {
        // 添加新产品
        const newProduct: Product = {
          id: Date.now().toString(),
          ...formData,
          createdAt: new Date().toISOString(),
          isPendingApproval: userRole === 'salesperson', // 业务员创建的产品需要审核
          createdBy: userName
        };
        updatedProducts = [...allProducts, newProduct];
        
        if (userRole === 'salesperson') {
          toast.success('产品已提交，等待管理员审核');
        } else {
          toast.success('产品添加成功');
        }
      }
      
      // 保存到本地存储
      localStorage.setItem('products', JSON.stringify(updatedProducts));
      
      // 重新加载产品列表
      loadProducts();
      closeModal();
    } catch (error) {
      toast.error('保存产品失败');
      console.error('保存产品失败:', error);
    }
  };

  // 审核产品
  const approveProduct = (productId: string, approve: boolean) => {
    if (!userRole || userRole !== 'admin') return;
    
    try {
      // 获取所有产品
      const storedProducts = localStorage.getItem('products');
      if (!storedProducts) return;
      
      const allProducts = JSON.parse(storedProducts);
      const updatedProducts = allProducts.map((product: Product) => 
        product.id === productId 
          ? approve 
            ? { ...product, isPendingApproval: false } 
            : product // 如果拒绝，保持原样（可以选择删除）
          : product
      );
      
      localStorage.setItem('products', JSON.stringify(updatedProducts));
      loadProducts();
      
      toast.success(approve ? '产品已批准' : '产品已拒绝');
    } catch (error) {
      toast.error('审核产品失败');
      console.error('审核产品失败:', error);
    }
  };

  // 删除待审核产品
  const deletePendingProduct = (productId: string) => {
    if (window.confirm('确定要删除这个待审核的产品吗？')) {
      try {
        // 获取所有产品
        const storedProducts = localStorage.getItem('products');
        if (!storedProducts) return;
        
        const allProducts = JSON.parse(storedProducts);
        const updatedProducts = allProducts.filter((product: Product) => product.id !== productId);
        
        localStorage.setItem('products', JSON.stringify(updatedProducts));
        loadProducts();
        
        toast.success('产品已删除');
      } catch (error) {
        toast.error('删除产品失败');
        console.error('删除产品失败:', error);
      }
    }
  };

  // 删除已批准的产品
  const deleteProduct = (id: string) => {
    if (window.confirm('确定要删除这个产品吗？')) {
      try {
        // 获取所有产品
        const storedProducts = localStorage.getItem('products');
        if (!storedProducts) return;
        
        const allProducts = JSON.parse(storedProducts);
        const updatedProducts = allProducts.filter((product: Product) => product.id !== id);
        
        localStorage.setItem('products', JSON.stringify(updatedProducts));
        loadProducts();
        
        toast.success('产品删除成功');
      } catch (error) {
        toast.error('删除产品失败');
        console.error('删除产品失败:', error);
      }
    }
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
          产品管理
        </h1>
        
        <div className="flex flex-col sm:flex-row gap-3">
          {/* 待审核产品标签页（只有有待审核产品时显示） */}
          {(userRole === 'admin' && pendingProducts.length > 0) && (
            <div className="flex border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
              <button
                onClick={() => setShowPendingTab(false)}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  !showPendingTab 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                已批准产品
              </button>
              <button
                onClick={() => setShowPendingTab(true)}
                className={`px-4 py-2 text-sm font-medium transition-colors relative ${
                  showPendingTab 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                待审核产品
                <span className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center bg-red-500 text-white text-xs rounded-full">
                  {pendingProducts.length}
                </span>
              </button>
            </div>
          )}
          
          {/* 添加产品按钮 */}
          <button
            onClick={() => openModal()}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
          >
            <i className="fa-solid fa-plus mr-2"></i>
            {userRole === 'salesperson' ? '提交产品' : '添加产品'}
          </button>
        </div>
      </div>
      
       {/* 产品列表或待审核产品列表 */}
      {(!showPendingTab && products.length > 0) ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden transition-all hover:shadow-md"
            >
              <div className="h-48 overflow-hidden">
                <img
                  src={product.image || 'https://space.coze.cn/api/coze_space/gen_image?image_size=square_hd&prompt=product%20placeholder&sign=5f01a548a7ff8f8fa96dc61046e75b54'}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform hover:scale-105"
                />
              </div>
              
              <div className="p-5">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">
                  {product.name}
                </h3>
                
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                    {formatPrice(product.price)}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {new Date(product.createdAt).toLocaleDateString()}
                  </span>
                </div>
                
                {userRole === 'admin' && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => openModal(product)}
                      className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg transition-colors text-sm"
                    >
                      <i className="fa-solid fa-pen-to-square mr-1"></i>
                      编辑
                    </button>
                    
                    <button
                      onClick={() => deleteProduct(product.id)}
                      className="flex-1 py-2 px-3 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-800/30 text-red-700 dark:text-red-300 rounded-lg transition-colors text-sm"
                    >
                      <i className="fa-solid fa-trash-alt mr-1"></i>
                      删除
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      ) : showPendingTab && pendingProducts.length > 0 ? (
        // 待审核产品列表
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {pendingProducts.map((product) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border-2 border-yellow-300 dark:border-yellow-600 overflow-hidden transition-all hover:shadow-md"
            >
              {/* 待审核标签 */}
              <div className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 text-xs font-semibold px-3 py-1 flex items-center">
                <i className="fa-solid fa-clock mr-1"></i>
                待审核
              </div>
              
              <div className="h-40 overflow-hidden">
                <img
                  src={product.image || 'https://space.coze.cn/api/coze_space/gen_image?image_size=square_hd&prompt=product%20placeholder&sign=5f01a548a7ff8f8fa96dc61046e75b54'}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform hover:scale-105"
                />
              </div>
              
              <div className="p-5">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">
                  {product.name}
                </h3>
                
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                    {formatPrice(product.price)}
                  </span>
                </div>
                
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                  提交人: {product.createdBy} | {new Date(product.createdAt).toLocaleDateString()}
                </div>
                
                {userRole === 'admin' ? (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => approveProduct(product.id, true)}
                      className="flex-1 py-2 px-3 bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-800/30 text-green-700 dark:text-green-300 rounded-lg transition-colors text-sm"
                    >
                      <i className="fa-solid fa-check mr-1"></i>
                      批准
                    </button>
                    
                    <button
                      onClick={() => deletePendingProduct(product.id)}
                      className="flex-1 py-2 px-3 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-800/30 text-red-700 dark:text-red-300 rounded-lg transition-colors text-sm"
                    >
                      <i className="fa-solid fa-times mr-1"></i>
                      拒绝
                    </button>
                  </div>
                ) : (
                  <div className="flex justify-center">
                    <button
                      onClick={() => deletePendingProduct(product.id)}
                      className="py-2 px-4 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-800/30 text-red-700 dark:text-red-300 rounded-lg transition-colors text-sm"
                    >
                      <i className="fa-solid fa-trash-alt mr-1"></i>
                      撤回
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-700 mb-4">
            <i className="fa-solid fa-box-open text-2xl text-slate-400 dark:text-slate-500"></i>
          </div>
          <h3 className="text-lg font-medium text-slate-800 dark:text-white mb-2">
            {showPendingTab ? '暂无待审核产品' : '暂无产品'}
          </h3>
          <p className="text-slate-500 dark:text-slate-400 mb-4">
            {showPendingTab 
              ? '所有产品都已审核完毕' 
              : (userRole === 'admin' ? '点击"添加产品"按钮开始创建您的第一个产品' : '暂无可用产品')
            }
          </p>
          
          {!showPendingTab && (
            <button
              onClick={() => openModal()}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors inline-flex items-center"
            >
              <i className="fa-solid fa-plus mr-2"></i>
              {userRole === 'salesperson' ? '提交产品' : '添加产品'}
            </button>
          )}
        </div>
      )}
      
      {/* 产品表单模态框 */}
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
            className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-100 dark:border-slate-700">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                {editingProduct ? '编辑产品' : '添加产品'}
              </h2>
            </div>
            
            <form onSubmit={saveProduct} className="p-6 space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  产品名称
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  placeholder="请输入产品名称"
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all outline-none"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  产品单价
                </label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleFormChange}
                  placeholder="请输入产品单价"
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all outline-none"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="image" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  产品图片URL
                </label>
                <input
                  type="text"
                  id="image"
                  name="image"
                  value={formData.image}
                  onChange={handleFormChange}
                  placeholder="请输入产品图片URL"
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all outline-none"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  如不提供，将使用默认图片
                </p>
              </div>
              
              {formData.image && (
                <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                  <img
                    src={formData.image}
                    alt="产品预览"
                    className="w-full h-40 object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://space.coze.cn/api/coze_space/gen_image?image_size=square_hd&prompt=product%20placeholder&sign=5f01a548a7ff8f8fa96dc61046e75b54';
                    }}
                  />
                </div>
              )}
              
              <div className="flex space-x-3 pt-2">
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
                  {editingProduct ? '保存修改' : '添加产品'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default Products;