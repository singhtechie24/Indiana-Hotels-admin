import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { setupAdminProfile } from '../utils/setupAdminProfile';
import { message, Form, Button, Input } from 'antd';

interface LoginFormValues {
  email: string;
  password: string;
}

export const LoginPage = () => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (values: LoginFormValues) => {
    try {
      setError('');
      setLoading(true);
      await login(values.email, values.password);
      // Navigation will happen automatically through the useEffect
    } catch (err) {
      console.error('Login error:', err);
      setError('Failed to sign in. Please check your credentials.');
      message.error('Failed to sign in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSetupAdmin = async () => {
    try {
      await setupAdminProfile();
      message.success('Admin profile setup successful');
    } catch (error) {
      console.error('Setup error:', error);
      message.error('Failed to setup admin profile');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Indiana Hotels Admin
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to your account
          </p>
        </div>
        
        <Form
          name="login"
          onFinish={handleSubmit}
          layout="vertical"
          className="mt-8"
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'Please input your email!' },
              { type: 'email', message: 'Please enter a valid email!' }
            ]}
          >
            <Input 
              placeholder="Email address"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Please input your password!' }]}
          >
            <Input.Password 
              placeholder="Password"
              size="large"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              className="w-full"
              size="large"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </Form.Item>
        </Form>

        <div className="mt-4 text-center">
          <Button 
            type="link" 
            onClick={handleSetupAdmin}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Setup Admin Profile
          </Button>
        </div>
      </div>
    </div>
  );
}; 