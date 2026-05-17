import { useState } from 'react'
import './App.css'

export default function App() {
  return (
    <div className="app">
      <header>
        <h1>🏡 ShedDesign - AI 花园棚屋设计助手</h1>
        <p>上传你的花园图纸，获得最优 Shed 设计建议</p>
      </header>
      
      <main>
        <section className="hero">
          <h2>欢迎使用 ShedDesign</h2>
          <p>只需三步：上传 → 回答 → 设计</p>
        </section>
      </main>
    </div>
  )
}
