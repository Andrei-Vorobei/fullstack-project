import type { JSX } from 'react';

import { HomeFilled, ProductFilled, ShoppingCartOutlined, StarFilled } from '@ant-design/icons';
import { FloatButton, Layout, Menu, Modal, theme } from 'antd';
import { Suspense, useEffect, useMemo } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router';

import type { Product } from '@/app-store/api/products-api';

import { useGetMeQuery, useRefreshQuery } from '@/app-store/api/auth-api';
import {
  useClearCartMutation,
  useAddCartItemMutation,
  useRemoveCartItemMutation,
  useSetCartItemQuantityMutation,
} from '@/app-store/api/cart-api';
import { getIsOpenCartModal, setIsOpenCartModal } from '@/app-store/reducers/app-global';
import {
  addGuestCartItem,
  clearGuestCart,
  getCount,
  removeGuestCartItem,
  setGuestCartItemQuantity,
  transferGuestCartToServer,
} from '@/app-store/reducers/cart-slice';
import { getProfile } from '@/app-store/reducers/user-slice';
import Cart from '@/components/cart';
import { useAppDispatch, useAppSelector } from '@/hooks';

const { Header, Content, Footer, Sider } = Layout;

const App: React.FC = (): JSX.Element => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const location = useLocation();

  const isOpenCartModal = useAppSelector(getIsOpenCartModal);

  useRefreshQuery();
  const accessToken = useAppSelector((state) => state.user.accessToken);
  useGetMeQuery(undefined, { skip: !accessToken });
  const [clearCart] = useClearCartMutation();
  const [addCartItem] = useAddCartItemMutation();
  const [removeCartItem] = useRemoveCartItemMutation();
  const [setCartItemQuantity] = useSetCartItemQuantityMutation();
  const cartCount = useAppSelector(getCount);
  const guestMigrationId = useAppSelector((state) => state.cart.guestMigrationId);
  const guestMigrationStatus = useAppSelector((state) => state.cart.guestMigrationStatus);
  const profile = useAppSelector(getProfile);

  useEffect(() => {
    if (
      accessToken &&
      guestMigrationId &&
      (guestMigrationStatus === 'pending' || guestMigrationStatus === 'idle')
    ) {
      void dispatch(transferGuestCartToServer());
    }
  }, [accessToken, dispatch, guestMigrationId, guestMigrationStatus]);

  const sidebarItems = useMemo(() => {
    return [
      {
        key: '/',
        icon: <HomeFilled />,
        label: 'Home',
      },
      {
        key: '/products',
        icon: <ProductFilled />,
        label: 'Products',
      },
      {
        key: '/login',
        icon: <StarFilled />,
        label: 'login',
      },
      {
        key: '/register',
        icon: <StarFilled />,
        label: 'register',
      },
      {
        key: '/profile',
        icon: <StarFilled />,
        label: 'profile',
      },
      {
        key: '/users',
        icon: <StarFilled />,
        label: 'users',
      },
    ];
  }, []);

  useEffect(() => {
    // console.log('location: ', location);
    // console.log('profile: ', profile);
  }, [location, profile]);

  const {
    token: { colorBgContainer },
  } = theme.useToken();

  const currentYear = new Date().getFullYear();

  const handleCartModal = (isOpen: boolean): void => {
    dispatch(setIsOpenCartModal(isOpen));
  };

  const handleAddToCart = (product: Product): void => {
    if (accessToken) {
      void addCartItem({ productId: product.id, quantity: 1 });
    } else {
      dispatch(addGuestCartItem(product));
    }
  };

  const handleClearCart = (): void => {
    if (accessToken) {
      void clearCart();
    } else {
      dispatch(clearGuestCart());
    }
  };

  const handleRemoveFromCart = (itemId: string): void => {
    if (accessToken) {
      void removeCartItem(itemId);
    } else {
      dispatch(removeGuestCartItem(itemId));
    }
  };

  const handleChangeQuantity = (itemId: string, quantity: number): void => {
    if (accessToken) {
      void setCartItemQuantity({ itemId, quantity });
    } else {
      dispatch(setGuestCartItemQuantity({ itemId, quantity }));
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider breakpoint="lg" collapsedWidth="0">
        <Menu
          theme="dark"
          mode="inline"
          items={sidebarItems}
          onClick={({ key }) => {
            void navigate(String(key));
          }}
          selectedKeys={[location.pathname]}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: 0, background: colorBgContainer }} />
        <Content style={{ margin: '24px 16px 0' }}>
          <Suspense fallback={<div role="status">Загрузка страницы...</div>}>
            <Outlet context={{ onAddToCart: handleAddToCart }} />
          </Suspense>
          <FloatButton
            style={{ height: '70px', width: '70px' }}
            tooltip="Корзина"
            onClick={(): void => handleCartModal(true)}
            icon={<ShoppingCartOutlined style={{ fontSize: '40px' }} />}
            badge={{ count: cartCount, color: 'red' }}
          />
          <Modal
            title="Корзина"
            closable={{ 'aria-label': 'Custom Close Button' }}
            open={isOpenCartModal}
            forceRender
            onOk={(): void => handleCartModal(false)}
            onCancel={(): void => handleCartModal(false)}
          >
            <Cart
              onRemoveProduct={handleRemoveFromCart}
              onChangeQuantity={handleChangeQuantity}
              onClearCart={handleClearCart}
            />
          </Modal>
        </Content>
        <Footer style={{ textAlign: 'center' }}>©{currentYear} Created</Footer>
      </Layout>
    </Layout>
  );
};

export default App;
