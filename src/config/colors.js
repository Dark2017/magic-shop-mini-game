// 魔法商店主题色彩配置
export const THEME_COLORS = {
  // 主题基础色
  PRIMARY: '#5D4E75',      // 深紫色 - 主要操作按钮
  SECONDARY: '#7B6C8D',    // 中紫色 - 次要操作按钮
  
  // 功能语义色
  SUCCESS: '#2E7D4A',      // 深绿色 - 成功/确认操作
  WARNING: '#B8860B',      // 深金色 - 警告/暂停操作
  DANGER: '#8B4513',       // 棕红色 - 危险/重置操作
  
  // 状态色
  ACTIVE: '#FFD700',       // 金色 - 激活/选中状态
  DISABLED: '#4A4A4A',     // 深灰色 - 禁用状态
  
  // 文字色
  TEXT_PRIMARY: '#FFFFFF',    // 主要文字颜色
  TEXT_SECONDARY: '#E0E0E0',  // 次要文字颜色
  TEXT_DISABLED: '#888888',   // 禁用文字颜色
}

// 按钮类型枚举
export const BUTTON_TYPES = {
  PRIMARY: 'primary',       // 主要操作
  SECONDARY: 'secondary',   // 次要操作
  SUCCESS: 'success',       // 成功确认
  WARNING: 'warning',       // 警告操作
  DANGER: 'danger',         // 危险操作
  ACTIVE: 'active',         // 激活状态
  DISABLED: 'disabled',     // 禁用状态
}

// 获取按钮颜色的工具函数
export function getButtonColor(type) {
  switch (type) {
    case BUTTON_TYPES.PRIMARY:
      return THEME_COLORS.PRIMARY
    case BUTTON_TYPES.SECONDARY:
      return THEME_COLORS.SECONDARY
    case BUTTON_TYPES.SUCCESS:
      return THEME_COLORS.SUCCESS
    case BUTTON_TYPES.WARNING:
      return THEME_COLORS.WARNING
    case BUTTON_TYPES.DANGER:
      return THEME_COLORS.DANGER
    case BUTTON_TYPES.ACTIVE:
      return THEME_COLORS.ACTIVE
    case BUTTON_TYPES.DISABLED:
      return THEME_COLORS.DISABLED
    default:
      return THEME_COLORS.PRIMARY
  }
}

// 获取按钮文字颜色
export function getButtonTextColor(type) {
  switch (type) {
    case BUTTON_TYPES.DISABLED:
      return THEME_COLORS.TEXT_DISABLED
    default:
      return THEME_COLORS.TEXT_PRIMARY
  }
}

// 生成悬停效果颜色（提亮20%）
export function getHoverColor(baseColor) {
  // 将十六进制转换为RGB
  const hex = baseColor.replace('#', '')
  const r = Math.min(255, Math.round(parseInt(hex.substr(0, 2), 16) * 1.2))
  const g = Math.min(255, Math.round(parseInt(hex.substr(2, 2), 16) * 1.2))
  const b = Math.min(255, Math.round(parseInt(hex.substr(4, 2), 16) * 1.2))
  
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

// 生成按下效果颜色（变暗15%）
export function getPressedColor(baseColor) {
  // 将十六进制转换为RGB
  const hex = baseColor.replace('#', '')
  const r = Math.round(parseInt(hex.substr(0, 2), 16) * 0.85)
  const g = Math.round(parseInt(hex.substr(2, 2), 16) * 0.85)
  const b = Math.round(parseInt(hex.substr(4, 2), 16) * 0.85)
  
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

// 常用按钮配置预设
export const BUTTON_CONFIGS = {
  // 游戏主要功能按钮
  START_GAME: { type: BUTTON_TYPES.SUCCESS, text: '开始游戏' },
  PAUSE_GAME: { type: BUTTON_TYPES.WARNING, text: '暂停' },
  RESUME_GAME: { type: BUTTON_TYPES.SUCCESS, text: '继续' },
  
  // 界面控制按钮
  MENU: { type: BUTTON_TYPES.PRIMARY, text: '菜单' },
  STATS: { type: BUTTON_TYPES.SECONDARY, text: '统计' },
  WORKSHOP: { type: BUTTON_TYPES.PRIMARY, text: '工作台' },
  SETTINGS: { type: BUTTON_TYPES.SECONDARY, text: '设置' },
  
  // 功能控制按钮
  AUTO_SELL_ON: { type: BUTTON_TYPES.ACTIVE, text: '自动售卖' },
  AUTO_SELL_OFF: { type: BUTTON_TYPES.DISABLED, text: '自动售卖' },
  
  // 面板控制按钮
  COLLAPSE: { type: BUTTON_TYPES.SECONDARY, text: '收缩' },
  EXPAND: { type: BUTTON_TYPES.SECONDARY, text: '展开' },
  
  // 升级相关按钮
  UPGRADE: { type: BUTTON_TYPES.SUCCESS, text: '升级' },
  UPGRADE_DISABLED: { type: BUTTON_TYPES.DISABLED, text: '升级' },
  
  // 危险操作按钮
  RESET: { type: BUTTON_TYPES.DANGER, text: '重置' },
  DELETE: { type: BUTTON_TYPES.DANGER, text: '删除' },
}
