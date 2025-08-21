// 微信小游戏入口文件
// 模拟经营+放置类游戏 - "魔法商店大亨"

import AdManager from './src/managers/AdManager.js'
import DataManager from './src/managers/DataManager.js'
import GameManager from './src/managers/GameManager.js'
import UIManager from './src/managers/UIManagerNew.js'
import QuestManager from './src/managers/QuestManager.js'

class Game {
  constructor() {
    this.canvas = wx.createCanvas()
    this.ctx = this.canvas.getContext('2d')
    
    // 设置画布大小
    this.canvas.width = wx.getSystemInfoSync().windowWidth
    this.canvas.height = wx.getSystemInfoSync().windowHeight
    
    // 初始化管理器
    this.adManager = new AdManager()
    this.dataManager = new DataManager()
    this.questManager = new QuestManager()
    this.gameManager = new GameManager(this.ctx, this.canvas)
    this.uiManager = new UIManager(this.ctx, this.canvas)
    
    this.init()
  }
  
  init() {
    console.log('游戏初始化开始')
    
    // 加载游戏数据
    this.dataManager.loadData()
    
    // 设置管理器之间的关联
    this.setupManagerReferences()
    
    // 设置游戏循环
    this.gameLoop()
    
    // 绑定事件
    this.bindEvents()
    
    console.log('游戏初始化完成')
  }
  
  setupManagerReferences() {
    // 让QuestManager能访问其他管理器
    this.questManager.setManagers({
      dataManager: this.dataManager,
      gameManager: this.gameManager
    })
    
    // 让GameManager能访问其他管理器
    this.gameManager.setManagers({
      adManager: this.adManager,
      dataManager: this.dataManager,
      uiManager: this.uiManager,
      questManager: this.questManager
    })
    
    // 让UIManager能访问其他管理器
    this.uiManager.setManagers({
      adManager: this.adManager,
      dataManager: this.dataManager,
      gameManager: this.gameManager,
      questManager: this.questManager
    })
    
    // 让AdManager能访问其他管理器
    this.adManager.setManagers({
      dataManager: this.dataManager,
      gameManager: this.gameManager,
      uiManager: this.uiManager
    })
    
    // 让DataManager能访问其他管理器
    this.dataManager.setManagers({
      gameManager: this.gameManager
    })
  }
  
  bindEvents() {
    // 触摸事件处理
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault() // 阻止默认行为，防止滚动等
      const touch = e.touches[0]
      console.log('Touch event received:', touch.clientX, touch.clientY)
      
      // 记录触摸开始位置，用于滚动判断
      this.touchStartY = touch.clientY
      this.touchStartTime = Date.now()
      
      // 先让UI管理器处理触摸（优先级更高）
      const uiHandled = this.uiManager.handleTouch(touch.clientX, touch.clientY)
      console.log('UI handled touch:', uiHandled)
      
      // 如果UI没有处理这个触摸，再让游戏管理器处理
      if (!uiHandled) {
        console.log('Passing touch to game manager')
        this.gameManager.handleTouch(touch)
      }
    })
    
    // 触摸结束事件
    this.canvas.addEventListener('touchend', (e) => {
      e.preventDefault()
    })
    
    // 触摸移动事件 - 处理滚动
    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault() // 防止页面滚动
      
      if (this.touchStartY !== undefined) {
        const touch = e.touches[0]
        const deltaY = touch.clientY - this.touchStartY
        const deltaTime = Date.now() - this.touchStartTime
        
        // 如果移动距离足够大且时间足够短，认为是滚动手势
        if (Math.abs(deltaY) > 10 && deltaTime < 500) {
          // 传递滚动事件给UI管理器
          const scrollHandled = this.uiManager.handleScroll(-deltaY * 0.5) // 反向并减少敏感度
          console.log('Scroll handled by UI:', scrollHandled)
          
          // 更新起始位置
          this.touchStartY = touch.clientY
        }
      }
    })
    
    // 鼠标滚轮事件（用于桌面端测试）
    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault()
      
      // 传递滚动事件给UI管理器
      const scrollHandled = this.uiManager.handleScroll(e.deltaY * 0.3) // 减少敏感度
      console.log('Wheel scroll handled by UI:', scrollHandled)
    })
    
    // 点击事件（作为触摸事件的补充，支持鼠标点击）
    this.canvas.addEventListener('click', (e) => {
      console.log('Click event received:', e.offsetX, e.offsetY)
      
      // 处理鼠标点击事件
      const uiHandled = this.uiManager.handleTouch(e.offsetX, e.offsetY)
      console.log('UI handled click:', uiHandled)
      
      if (!uiHandled) {
        console.log('Passing click to game manager')
        this.gameManager.handleTouch({ clientX: e.offsetX, clientY: e.offsetY })
      }
    })
    
    // 应用进入后台
    wx.onHide(() => {
      this.dataManager.saveData()
      this.gameManager.calculateOfflineProgress()
    })
    
    // 应用回到前台
    wx.onShow(() => {
      this.gameManager.showOfflineRewards()
    })
  }
  
  gameLoop() {
    this.update()
    this.render()
    requestAnimationFrame(() => this.gameLoop())
  }
  
  update() {
    this.gameManager.update()
    this.uiManager.update()
    this.questManager.update()
  }
  
  render() {
    // 清空画布
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    
    // 渲染游戏
    this.gameManager.render()
    
    // 渲染UI层
    this.uiManager.render()
    
    // 最后渲染烟花粒子，确保显示在最顶层
    this.gameManager.renderFireworkParticles()
  }
}

// 启动游戏
new Game()
