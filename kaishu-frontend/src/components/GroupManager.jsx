import React, { useState, useEffect } from 'react';
import {
  Card, List, Button, Input, Modal, Form, message, Space, Tooltip,
  Popconfirm, Tree, Badge, Typography, Divider, Select
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, FolderOutlined,
  FolderOpenOutlined, FileImageOutlined, SettingOutlined
} from '@ant-design/icons';
import { useAuth } from './AuthContext';

const { Title, Text } = Typography;
const { Option } = Select;

const GroupManager = ({ onGroupSelect, selectedGroup }) => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [form] = Form.useForm();
  const { currentUser } = useAuth();

  // 获取分组列表
  const fetchGroups = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/groups');
      const data = await response.json();
      setGroups(data.groups || []);
    } catch (error) {
      console.error('获取分组列表失败:', error);
      message.error('获取分组列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  // 创建或更新分组
  const handleSubmit = async (values) => {
    try {
      const token = localStorage.getItem('token');
      const url = editingGroup ? `/api/groups/${editingGroup.id}` : '/api/groups';
      const method = editingGroup ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(values)
      });
      
      if (response.ok) {
        message.success(editingGroup ? '分组更新成功' : '分组创建成功');
        setModalVisible(false);
        setEditingGroup(null);
        form.resetFields();
        fetchGroups();
      } else {
        const error = await response.json();
        message.error(error.error || '操作失败');
      }
    } catch (error) {
      console.error('操作失败:', error);
      message.error('操作失败');
    }
  };

  // 删除分组
  const handleDelete = async (group) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/groups/${group.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        message.success('分组删除成功');
        fetchGroups();
      } else {
        const error = await response.json();
        message.error(error.error || '删除失败');
      }
    } catch (error) {
      console.error('删除失败:', error);
      message.error('删除失败');
    }
  };

  // 打开编辑模态框
  const openEditModal = (group = null) => {
    setEditingGroup(group);
    if (group) {
      form.setFieldsValue({
        name: group.name,
        description: group.description,
        parent_id: group.parent_id
      });
    } else {
      form.resetFields();
    }
    setModalVisible(true);
  };

  // 构建树形数据
  const buildTreeData = (groups) => {
    const groupMap = {};
    const rootGroups = [];
    
    // 创建分组映射
    groups.forEach(group => {
      groupMap[group.id] = {
        ...group,
        key: group.id,
        title: (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Space>
              <FolderOutlined style={{ color: '#1890ff' }} />
              <Text>{group.name}</Text>
              <Badge count={group.work_count} style={{ backgroundColor: '#52c41a' }} />
            </Space>
            <Space>
              <Tooltip title="编辑分组">
                <Button
                  type="text"
                  size="small"
                  icon={<EditOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                    openEditModal(group);
                  }}
                />
              </Tooltip>
              <Tooltip title="删除分组">
                <Popconfirm
                  title="确定要删除这个分组吗？"
                  onConfirm={(e) => {
                    e.stopPropagation();
                    handleDelete(group);
                  }}
                  okText="确定"
                  cancelText="取消"
                >
                  <Button
                    type="text"
                    size="small"
                    icon={<DeleteOutlined />}
                    danger
                    onClick={(e) => e.stopPropagation()}
                  />
                </Popconfirm>
              </Tooltip>
            </Space>
          </div>
        ),
        children: []
      };
    });
    
    // 构建树形结构
    groups.forEach(group => {
      if (group.parent_id && groupMap[group.parent_id]) {
        groupMap[group.parent_id].children.push(groupMap[group.id]);
      } else {
        rootGroups.push(groupMap[group.id]);
      }
    });
    
    return rootGroups;
  };

  const treeData = buildTreeData(groups);

  // 获取父分组选项
  const getParentOptions = () => {
    return groups
      .filter(group => !group.parent_id) // 只显示顶级分组作为父分组选项
      .map(group => (
        <Option key={group.id} value={group.id}>
          {group.name}
        </Option>
      ));
  };

  return (
    <Card
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={4} style={{ margin: 0 }}>分组管理</Title>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => openEditModal()}
            disabled={!currentUser}
          >
            新建分组
          </Button>
        </div>
      }
      size="small"
    >
      {treeData.length > 0 ? (
        <Tree
          treeData={treeData}
          defaultExpandAll
          selectedKeys={selectedGroup ? [selectedGroup.toString()] : []}
          onSelect={(selectedKeys, info) => {
            if (selectedKeys.length > 0 && onGroupSelect) {
              const groupId = selectedKeys[0];
              const group = groups.find(g => g.id.toString() === groupId.toString());
              onGroupSelect(group);
            }
          }}
          style={{ marginTop: '16px' }}
        />
      ) : (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
          <FolderOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
          <div>暂无分组</div>
          <div style={{ fontSize: '12px', marginTop: '8px' }}>点击上方按钮创建第一个分组</div>
        </div>
      )}
      
      <Modal
        title={editingGroup ? '编辑分组' : '新建分组'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingGroup(null);
          form.resetFields();
        }}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="name"
            label="分组名称"
            rules={[
              { required: true, message: '请输入分组名称' },
              { max: 50, message: '分组名称不能超过50个字符' }
            ]}
          >
            <Input placeholder="请输入分组名称" />
          </Form.Item>
          
          <Form.Item
            name="parent_id"
            label="父分组"
          >
            <Select
              placeholder="选择父分组（可选）"
              allowClear
            >
              {getParentOptions()}
            </Select>
          </Form.Item>
          
          <Form.Item
            name="description"
            label="分组描述"
          >
            <Input.TextArea
              placeholder="请输入分组描述（可选）"
              rows={3}
              maxLength={200}
            />
          </Form.Item>
          
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button
                onClick={() => {
                  setModalVisible(false);
                  setEditingGroup(null);
                  form.resetFields();
                }}
              >
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                {editingGroup ? '更新' : '创建'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default GroupManager;