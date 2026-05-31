import { ArrowRightOutlined, LockOutlined, MailOutlined, PhoneOutlined, UserOutlined } from '@ant-design/icons';
import type { LoginUserRequest, RegisterUserRequest } from '@xingliu/shared/user';
import { Button, Card, Flex, Form, Input, Tabs, message } from 'antd';
import { useAuthStore } from '@/stores/user-store';
import { loginApi, registerApi } from '@/api/user';
import { useNavigate } from 'react-router-dom';
import type { Rule } from 'antd/es/form';

const inputClassName = '!rounded-xl !border-none !bg-[#f1f2f6] !px-3 !text-sm !shadow-none';
const submitButtonClassName =
  '!mt-5 !h-11 !rounded-xl !border-none !bg-[#ffacc0] !text-sm !font-semibold !shadow-none hover:!bg-[#ff8faa] [&_.ant-btn-icon]:!text-xs';

export default function LoginAddRegister() {
  const tabItems = [
    {
      label: '登录',
      key: 'login',
      children: <LoginForm />,
    },
    {
      label: '注册',
      key: 'register',
      children: <RegisterForm />,
    },
  ];

  return (
    <Card variant="borderless" className="w-full max-w-105 shadow-sm" styles={{ body: { padding: '24px 28px 28px' } }}>
      <Tabs defaultActiveKey="login" centered items={tabItems} />
    </Card>
  );
}

function LoginForm() {
  const { setToken, setUser } = useAuthStore();
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const loginRules = {
    account: [
      { required: true, message: '请输入电话或者邮箱' },
      {
        validator: (_: unknown, value?: string) => {
          if (!value) return Promise.resolve();
          const phoneReg = /^1[3-9]\d{9}$/;
          const emailReg = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (phoneReg.test(value) || emailReg.test(value)) {
            return Promise.resolve();
          }
          return Promise.reject(new Error('请输入正确的电话或者邮箱'));
        },
      },
    ],
    password: [
      { required: true, message: '请输入密码' },
      {
        pattern: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,16}$/,
        message: '密码至少6-16位,且包含字母和数字',
      },
    ],
    confirmPassword: [
      { required: true, message: '请再次输入密码' },
      {
        validator: (_: unknown, value?: string) => {
          if (!value) return Promise.resolve();
          if (value !== form.getFieldValue('password')) {
            return Promise.reject(new Error('两次输入的密码不一致'));
          }
          return Promise.resolve();
        },
      },
    ],
  };

  const handleFinish = async (values: LoginUserRequest & { captcha?: string; confirmPassword?: string }) => {
    const res = await loginApi({
      account: values.account,
      password: values.password,
    });

    if (!res.code) {
      message.success(res.message ?? '登录成功');
      setToken(res.data.token);
      setUser(res.data.user);
      navigate('/home');
    } else {
      message.error(res.message ?? '登录失败，请检查账号或密码');
    }
  };

  return (
    <Form form={form} layout="vertical" requiredMark={false} onFinish={handleFinish}>
      <Form.Item name="account" rules={loginRules.account}>
        <Input
          size="large"
          variant="filled"
          placeholder="请输入电话或者邮箱"
          prefix={<UserOutlined className="text-gray-400" />}
          autoComplete="username"
          className={inputClassName}
        />
      </Form.Item>

      <Form.Item name="password" rules={loginRules.password}>
        <Input.Password
          size="large"
          variant="filled"
          placeholder="请输入密码"
          prefix={<LockOutlined className="text-gray-400" />}
          autoComplete="current-password"
          className={inputClassName}
        />
      </Form.Item>

      <Form.Item name="confirmPassword" dependencies={['password']} rules={loginRules.confirmPassword}>
        <Input.Password
          size="large"
          variant="filled"
          placeholder="请再次输入密码"
          prefix={<LockOutlined className="text-gray-400" />}
          autoComplete="new-password"
          className={inputClassName}
        />
      </Form.Item>

      <Button
        type="primary"
        htmlType="submit"
        size="large"
        block
        icon={<ArrowRightOutlined />}
        className={submitButtonClassName}
      >
        登录
      </Button>
    </Form>
  );
}

function RegisterForm() {
  const { setToken, setUser } = useAuthStore();
  const navigate = useNavigate();

  const handleFinish = async (values: RegisterUserRequest) => {
    const res = await registerApi(values);

    if (!res.code) {
      message.success(res.message ?? '注册成功');
      setToken(res.data.token);
      setUser(res.data.user);
      navigate('/home');
    } else {
      message.error(res.message ?? '注册失败，请检查输入信息');
    }
  };

  const registerRules: Record<'phone' | 'email' | 'username' | 'password', Rule[]> = {
    phone: [
      { required: true, message: '请输入电话号码' },
      { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' },
    ],
    email: [
      { required: false, message: '请输入邮箱' },
      { type: 'email', message: '请输入正确的邮箱' },
    ],
    username: [
      { required: true, message: '请输入用户名' },
      {
        max: 12,
        message: '用户名不能超过 12 个字符',
      },
    ],
    password: [
      { required: true, message: '请输入密码' },
      { pattern: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,16}$/, message: '密码至少6-16位,且包含字母和数字' },
    ],
  };

  return (
    <Form layout="vertical" requiredMark={false} onFinish={handleFinish}>
      <Flex gap={10}>
        <Form.Item name="phone" rules={registerRules.phone}>
          <Input
            size="large"
            variant="filled"
            placeholder="请输入电话"
            prefix={<PhoneOutlined className="text-gray-400" />}
            autoComplete="tel"
            className={inputClassName}
          />
        </Form.Item>

        <Form.Item name="email" rules={registerRules.email}>
          <Input
            size="large"
            variant="filled"
            placeholder="请输入邮箱（可选）"
            prefix={<MailOutlined className="text-gray-400" />}
            autoComplete="email"
            className={inputClassName}
          />
        </Form.Item>
      </Flex>

      <Form.Item name="username" rules={registerRules.username}>
        <Input
          size="large"
          variant="filled"
          placeholder="请输入用户名"
          prefix={<UserOutlined className="text-gray-400" />}
          autoComplete="name"
          className={inputClassName}
        />
      </Form.Item>

      <Form.Item name="password" rules={registerRules.password}>
        <Input.Password
          size="large"
          variant="filled"
          placeholder="请输入密码"
          prefix={<LockOutlined className="text-gray-400" />}
          autoComplete="new-password"
          className={inputClassName}
        />
      </Form.Item>

      <Button
        type="primary"
        htmlType="submit"
        size="large"
        block
        icon={<ArrowRightOutlined />}
        className={submitButtonClassName}
      >
        注册
      </Button>
    </Form>
  );
}
