import UIUtils from '../utils/UIUtils.js'

// 商店面板组件
export default class ShopPanel {
  constructor(ctx, canvas) {
    this.ctx = ctx
    this.canvas = canvas
    this.isVisible = false
    this.closeButton = null
    this.shopItems = []
    this.shopButtons = []
    this.dataManager = null
    this.gameManager = null
    
    // 滚动相关
    this.scrollY = 0
    this.maxScrollY = 0
    this.itemHeight = 70
    this.itemSpacing = 5
    
    // 初始化商店物品
    this.initShopItems()
  }
  
  setManagers(managers) {
    this.dataManager = managers.dataManager
    this.gameManager = managers.gameManager
  }
  
  show() {
    this.isVisible = true
  }
  
  hide() {
    this.isVisible = false
  }
  
  // 初始化商店物品
  initShopItems() {
    this.shopItems = [
      {
        id: 'speed_boost',
        name: '生产加速',
        description: '所有工作台生产速度提升50%，持续5分钟',
        price: { gold: 1000, gems: 0 },
        category: 'boost',
        icon: '⚡',
        duration: 300000 // 5分钟
      },
      {
        id: 'income_boost',
        name: '收益提升',
        description: '所有收益提升100%，持续10分钟',
        price: { gold: 2000, gems: 0 },
        category: 'boost',
        icon: '💰',
        duration: 600000 // 10分钟
      },
      {
        id: 'patience_boost',
        name: '顾客耐心',
        description: '所有顾客耐心时间延长5秒，持续15分钟',
        price: { gold: 1500, gems: 0 },
        category: 'boost',
        icon: '⏰',
        duration: 900000 // 15分钟
      },
      {
        id: 'auto_collect',
        name: '自动收集器',
        description: '自动收集所有工作台产品，持续30分钟',
        price: { gold: 0, gems: 5 },
        category: 'automation',
        icon: '🤖',
        duration: 1800000 // 30分钟
      },
      {
        id: 'gem_pack_small',
        name: '小宝石包',
        description: '获得10个宝石',
        price: { gold: 5000, gems: 0 },
        category: 'resource',
        icon: '💎',
        amount: 10
      },
      {
        id: 'gold_pack_large',
        name: '大金币包',
        description: '获得10000金币',
        price: { gold: 0, gems: 3 },
        category: 'resource',
        icon: '💰',
        amount: 10000
      },
      {
        id: 'workshop_upgrade_material',
        name: '升级材料包',
        description: '包含各种工作台升级所需材料',
        price: { gold: 3000, gems: 2 },
        category: 'material',
        icon: '🔧',
        materials: {
          iron: 50,
          wood: 100,
          crystal: 20
        }
      },
      {
        id: 'experience_potion',
        name: '经验药水',
        description: '立即获得500经验值',
        price: { gold: 1500, gems: 0 },
        category: 'resource',
        icon: '🧪',
        amount: 500
      }
    ]
  }
  
  render() {
    if (!this.isVisible) return
    
    const panelWidth = Math.min(400, this.canvas.width - 30)
    const panelHeight = 650
    const x = (this.canvas.width - panelWidth) / 2
    const y = (this.canvas.height - panelHeight) / 2
    
    // 半透明背景
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
    
    // 面板背景 - 魔法商店主题色
    this.ctx.fillStyle = '#2C1810'
    this.ctx.fillRect(x, y, panelWidth, panelHeight)
    this.ctx.strokeStyle = '#FFD700'
    this.ctx.lineWidth = 3
    this.ctx.strokeRect(x, y, panelWidth, panelHeight)
    
    // 标题
    this.ctx.fillStyle = '#FFD700'
    this.ctx.font = 'bold 20px Arial'
    this.ctx.textAlign = 'center'
    this.ctx.fillText('🏪 魔法商店', x + panelWidth / 2, y + 35)
    
    // 玩家资源显示
    this.renderPlayerResources(x, y + 50, panelWidth)
    
    // 商店物品列表
    this.renderShopItems(x, y + 90, panelWidth, panelHeight - 140)
    
    // 关闭按钮
    this.closeButton = {
      x: x + panelWidth - 40,
      y: y + 10,
      width: 30,
      height: 30
    }
    this.renderCloseButton()
  }
  
  renderPlayerResources(x, y, width) {
    if (!this.dataManager) return
    
    const resourceHeight = 25
    this.ctx.fillStyle = '#1F1611'
    this.ctx.fillRect(x + 10, y, width - 20, resourceHeight)
    this.ctx.strokeStyle = '#8B4513'
    this.ctx.lineWidth = 1
    this.ctx.strokeRect(x + 10, y, width - 20, resourceHeight)
    
    // 金币
    this.ctx.fillStyle = '#FFD700'
    this.ctx.font = '14px Arial'
    this.ctx.textAlign = 'left'
    this.ctx.fillText(`💰 ${this.dataManager.getGold()}`, x + 20, y + 17)
    
    // 宝石
    this.ctx.fillStyle = '#FF69B4'
    this.ctx.textAlign = 'center'
    this.ctx.fillText(`💎 ${this.dataManager.getGems()}`, x + width / 2, y + 17)
    
    // 等级
    this.ctx.fillStyle = '#90EE90'
    this.ctx.textAlign = 'right'
    this.ctx.fillText(`⭐ Lv.${this.dataManager.getLevel()}`, x + width - 20, y + 17)
  }
  
  renderShopItems(x, y, width, height) {
    const contentHeight = height - 20
    const totalItemsHeight = this.shopItems.length * (this.itemHeight + this.itemSpacing) - this.itemSpacing
    
    // 计算最大滚动位置
    this.maxScrollY = Math.max(0, totalItemsHeight - contentHeight)
    
    // 限制滚动位置
    this.scrollY = Math.max(0, Math.min(this.scrollY, this.maxScrollY))
    
    // 创建裁剪区域
    this.ctx.save()
    this.ctx.beginPath()
    this.ctx.rect(x + 10, y + 10, width - 40, contentHeight) // 为滚动条留出空间
    this.ctx.clip()
    
    let currentY = y + 10 - this.scrollY
    this.shopButtons = []
    
    // 只渲染可见的物品
    const startIndex = Math.max(0, Math.floor(this.scrollY / (this.itemHeight + this.itemSpacing)))
    const endIndex = Math.min(this.shopItems.length, startIndex + Math.ceil(contentHeight / (this.itemHeight + this.itemSpacing)) + 1)
    
    for (let i = startIndex; i < endIndex; i++) {
      const item = this.shopItems[i]
      const itemY = y + 10 + i * (this.itemHeight + this.itemSpacing) - this.scrollY
      
      // 只渲染在可见区域内的物品
      if (itemY + this.itemHeight >= y + 10 && itemY <= y + 10 + contentHeight) {
        const itemRect = {
          x: x + 10,
          y: itemY,
          width: width - 40, // 为滚动条留出空间
          height: this.itemHeight
        }
        
        this.renderShopItem(item, itemRect)
      }
    }
    
    this.ctx.restore()
    
    // 渲染滚动条
    if (this.maxScrollY > 0) {
      this.renderScrollbar(x + width - 30, y + 10, 20, contentHeight)
    }
  }
  
  // 渲染滚动条
  renderScrollbar(x, y, width, height) {
    // 滚动条背景
    this.ctx.fillStyle = '#1F1611'
    this.ctx.fillRect(x, y, width, height)
    this.ctx.strokeStyle = '#8B4513'
    this.ctx.lineWidth = 1
    this.ctx.strokeRect(x, y, width, height)
    
    // 滚动条滑块
    const scrollPercent = this.scrollY / this.maxScrollY
    const thumbHeight = Math.max(20, (height * height) / (height + this.maxScrollY))
    const thumbY = y + (height - thumbHeight) * scrollPercent
    
    this.ctx.fillStyle = '#FFD700'
    this.ctx.fillRect(x + 2, thumbY, width - 4, thumbHeight)
    this.ctx.strokeStyle = '#8B4513'
    this.ctx.lineWidth = 1
    this.ctx.strokeRect(x + 2, thumbY, width - 4, thumbHeight)
  }
  
  renderShopItem(item, rect) {
    // 检查是否可以购买
    const canAfford = this.canAffordItem(item)
    
    // 物品背景
    const gradient = this.ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.height)
    if (canAfford) {
      gradient.addColorStop(0, '#8B4513')
      gradient.addColorStop(1, '#654321')
    } else {
      gradient.addColorStop(0, '#4A4A4A')
      gradient.addColorStop(1, '#2F2F2F')
    }
    
    this.ctx.fillStyle = gradient
    this.ctx.fillRect(rect.x, rect.y, rect.width, rect.height)
    this.ctx.strokeStyle = canAfford ? '#FFD700' : '#666666'
    this.ctx.lineWidth = 2
    this.ctx.strokeRect(rect.x, rect.y, rect.width, rect.height)
    
    // 物品图标
    this.ctx.fillStyle = '#FFD700'
    this.ctx.font = '24px Arial'
    this.ctx.textAlign = 'center'
    this.ctx.fillText(item.icon, rect.x + 30, rect.y + 35)
    
    // 物品名称
    this.ctx.fillStyle = canAfford ? '#FFFFFF' : '#AAAAAA'
    this.ctx.font = 'bold 14px Arial'
    this.ctx.textAlign = 'left'
    this.ctx.fillText(item.name, rect.x + 60, rect.y + 20)
    
    // 物品描述
    this.ctx.fillStyle = canAfford ? '#CCCCCC' : '#777777'
    this.ctx.font = '11px Arial'
    this.ctx.fillText(item.description, rect.x + 60, rect.y + 38)
    
    // 价格
    this.ctx.fillStyle = canAfford ? '#FFD700' : '#999999'
    this.ctx.font = '12px Arial'
    let priceText = ''
    if (item.price.gold > 0) {
      priceText += `💰${item.price.gold}`
    }
    if (item.price.gems > 0) {
      if (priceText) priceText += ' '
      priceText += `💎${item.price.gems}`
    }
    this.ctx.fillText(priceText, rect.x + 60, rect.y + 55)
    
    // 购买按钮
    const buttonWidth = 60
    const buttonHeight = 25
    const button = {
      x: rect.x + rect.width - buttonWidth - 10,
      y: rect.y + rect.height / 2 - buttonHeight / 2,
      width: buttonWidth,
      height: buttonHeight,
      item: item
    }
    
    this.ctx.fillStyle = canAfford ? '#4CAF50' : '#757575'
    this.ctx.fillRect(button.x, button.y, button.width, button.height)
    this.ctx.strokeStyle = '#FFFFFF'
    this.ctx.lineWidth = 1
    this.ctx.strokeRect(button.x, button.y, button.width, button.height)
    
    this.ctx.fillStyle = '#FFFFFF'
    this.ctx.font = '10px Arial'
    this.ctx.textAlign = 'center'
    this.ctx.fillText(canAfford ? '购买' : '不足', button.x + button.width / 2, button.y + button.height / 2 + 3)
    
    this.shopButtons.push(button)
  }
  
  renderCloseButton() {
    if (!this.closeButton) return
    
    UIUtils.drawRoundRect(this.ctx, this.closeButton, '#FF4444', 12)
    
    // 按钮文字
    this.ctx.fillStyle = '#FFFFFF'
    this.ctx.font = '14px Arial'
    this.ctx.textAlign = 'center'
    this.ctx.fillText('✖', this.closeButton.x + this.closeButton.width / 2, this.closeButton.y + this.closeButton.height / 2 + 5)
  }
  
  canAffordItem(item) {
    if (!this.dataManager) return false
    
    const hasEnoughGold = this.dataManager.getGold() >= item.price.gold
    const hasEnoughGems = this.dataManager.getGems() >= item.price.gems
    
    return hasEnoughGold && hasEnoughGems
  }
  
  handleTouch(x, y) {
    if (!this.isVisible) return false
    
    // 检查关闭按钮
    if (this.closeButton && UIUtils.isPointInRect(x, y, this.closeButton)) {
      this.hide()
      return true
    }
    
    // 检查购买按钮
    for (const button of this.shopButtons) {
      if (UIUtils.isPointInRect(x, y, button)) {
        this.handlePurchase(button.item)
        return true
      }
    }
    
    return true // 阻止点击穿透
  }
  
  // 处理滚动事件
  handleScroll(deltaY) {
    if (!this.isVisible) return false
    
    const scrollAmount = deltaY * 30 // 调整滚动灵敏度
    this.scrollY += scrollAmount
    this.scrollY = Math.max(0, Math.min(this.scrollY, this.maxScrollY))
    
    return true // 滚动被处理
  }
  
  handlePurchase(item) {
    if (!this.canAffordItem(item)) {
      // 显示购买失败提示
      this.showPurchaseResult(false, `资源不足！需要: ${this.formatPrice(item.price)}`)
      return
    }
    
    // 扣除费用
    if (item.price.gold > 0) {
      this.dataManager.spendGold(item.price.gold)
    }
    if (item.price.gems > 0) {
      this.dataManager.spendGems(item.price.gems)
    }
    
    // 应用物品效果
    this.applyItemEffect(item)
    
    // 显示购买成功提示
    this.showPurchaseResult(true, `成功购买 ${item.name}！`)
    
    console.log(`购买了商店物品: ${item.name}`)
  }
  
  // 格式化价格显示
  formatPrice(price) {
    let priceText = ''
    if (price.gold > 0) {
      priceText += `💰${price.gold}`
    }
    if (price.gems > 0) {
      if (priceText) priceText += ' '
      priceText += `💎${price.gems}`
    }
    return priceText
  }
  
  // 显示购买结果提示
  showPurchaseResult(success, message) {
    // 使用小程序的轻提示或浏览器的alert
    if (typeof wx !== 'undefined' && wx.showToast) {
      wx.showToast({
        title: message,
        icon: success ? 'success' : 'none',
        duration: 2000
      })
    } else {
      // 浏览器环境使用自定义提示
      if (this.gameManager && this.gameManager.createFloatingText) {
        this.gameManager.createFloatingText(
          message, 
          this.canvas.width / 2, 
          this.canvas.height / 2, 
          success ? '#00FF00' : '#FF0000', 
          16
        )
      } else {
        // 兜底使用alert
        alert(message)
      }
    }
  }
  
  applyItemEffect(item) {
    switch (item.category) {
      case 'boost':
        this.applyBoostEffect(item)
        break
      case 'resource':
        this.applyResourceEffect(item)
        break
      case 'automation':
        this.applyAutomationEffect(item)
        break
      case 'material':
        this.applyMaterialEffect(item)
        break
    }
  }
  
  applyBoostEffect(item) {
    // 添加临时效果到数据管理器
    if (!this.dataManager.gameData.activeBoosts) {
      this.dataManager.gameData.activeBoosts = []
    }
    
    const boost = {
      id: item.id,
      name: item.name,
      startTime: Date.now(),
      duration: item.duration,
      type: item.id
    }
    
    this.dataManager.gameData.activeBoosts.push(boost)
    this.dataManager.markDirty()
  }
  
  applyResourceEffect(item) {
    switch (item.id) {
      case 'gem_pack_small':
        this.dataManager.addGems(item.amount)
        break
      case 'gold_pack_large':
        this.dataManager.addGold(item.amount)
        break
      case 'experience_potion':
        this.dataManager.addExp(item.amount)
        break
    }
  }
  
  applyAutomationEffect(item) {
    // 自动收集器效果
    if (item.id === 'auto_collect') {
      if (!this.dataManager.gameData.activeBoosts) {
        this.dataManager.gameData.activeBoosts = []
      }
      
      const autoCollectBoost = {
        id: 'auto_collect',
        name: '自动收集器',
        startTime: Date.now(),
        duration: item.duration,
        type: 'auto_collect'
      }
      
      this.dataManager.gameData.activeBoosts.push(autoCollectBoost)
      this.dataManager.markDirty()
    }
  }
  
  applyMaterialEffect(item) {
    // 升级材料包效果
    if (item.id === 'workshop_upgrade_material') {
      if (!this.dataManager.gameData.materials) {
        this.dataManager.gameData.materials = {}
      }
      
      Object.entries(item.materials).forEach(([material, amount]) => {
        this.dataManager.gameData.materials[material] = (this.dataManager.gameData.materials[material] || 0) + amount
      })
      
      this.dataManager.markDirty()
    }
  }
}
