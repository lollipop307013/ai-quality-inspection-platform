#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Mermaid to PNG Converter
将Markdown文档中的Mermaid流程图转换为PNG图片并更新文档引用

Author: AI Assistant
Date: 2026-01-21
"""

import re
import os
import subprocess
import tempfile
from pathlib import Path
from typing import List, Dict, Tuple


class MermaidConverter:
    """Mermaid流程图转换器"""
    
    def __init__(self, doc_path: str, images_dir: str):
        """
        初始化转换器
        
        Args:
            doc_path: 需求文档路径
            images_dir: 图片输出目录
        """
        self.doc_path = Path(doc_path)
        self.images_dir = Path(images_dir)
        self.images_dir.mkdir(exist_ok=True)
        
        # 图片文件名映射
        self.image_names = {
            0: "功能依赖关系图.png",
            1: "开发阶段规划图.png", 
            2: "数据流向图.png",
            3: "数据模型依赖图.png"
        }
    
    def extract_mermaid_blocks(self, content: str) -> List[Dict]:
        """
        提取文档中的所有Mermaid代码块
        
        Args:
            content: 文档内容
            
        Returns:
            包含Mermaid代码块信息的列表
        """
        # 匹配Mermaid代码块的正则表达式
        pattern = r'```mermaid\n(.*?)\n```'
        matches = re.finditer(pattern, content, re.DOTALL)
        
        blocks = []
        for i, match in enumerate(matches):
            block_info = {
                'index': i,
                'start': match.start(),
                'end': match.end(),
                'code': match.group(1).strip(),
                'full_match': match.group(0),
                'image_name': self.image_names.get(i, f"mermaid_chart_{i}.png")
            }
            blocks.append(block_info)
            
        print(f"✅ 找到 {len(blocks)} 个Mermaid代码块")
        return blocks
    
    def generate_image(self, mermaid_code: str, output_path: str) -> bool:
        """
        使用mermaid-cli生成PNG图片
        
        Args:
            mermaid_code: Mermaid代码
            output_path: 输出图片路径
            
        Returns:
            是否生成成功
        """
        try:
            # 创建临时mermaid文件
            with tempfile.NamedTemporaryFile(mode='w', suffix='.mmd', delete=False, encoding='utf-8') as temp_file:
                temp_file.write(mermaid_code)
                temp_file_path = temp_file.name
            
            # 使用mmdc命令生成PNG
            cmd = [
                'mmdc',
                '-i', temp_file_path,
                '-o', output_path,
                '-t', 'neutral',  # 使用中性主题
                '-b', 'white',    # 白色背景
                '--width', '1200', # 设置宽度
                '--height', '800'  # 设置高度
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8')
            
            # 清理临时文件
            os.unlink(temp_file_path)
            
            if result.returncode == 0:
                print(f"✅ 成功生成图片: {output_path}")
                return True
            else:
                print(f"❌ 生成图片失败: {result.stderr}")
                return False
                
        except Exception as e:
            print(f"❌ 生成图片时发生错误: {str(e)}")
            return False
    
    def update_document(self, original_content: str, blocks: List[Dict]) -> str:
        """
        更新文档，将Mermaid代码块替换为图片链接
        
        Args:
            original_content: 原始文档内容
            blocks: Mermaid代码块信息列表
            
        Returns:
            更新后的文档内容
        """
        updated_content = original_content
        
        # 从后往前替换，避免位置偏移
        for block in reversed(blocks):
            image_path = f"./images/{block['image_name']}"
            
            # 创建图片引用，保持原有的标题结构
            replacement = f"![{block['image_name'][:-4]}]({image_path})"
            
            # 替换Mermaid代码块
            updated_content = (
                updated_content[:block['start']] + 
                replacement + 
                updated_content[block['end']:]
            )
            
            print(f"✅ 替换代码块 {block['index']}: {block['image_name']}")
        
        return updated_content
    
    def convert(self) -> bool:
        """
        执行完整的转换流程
        
        Returns:
            是否转换成功
        """
        try:
            # 读取文档
            print(f"📖 读取文档: {self.doc_path}")
            with open(self.doc_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # 提取Mermaid代码块
            blocks = self.extract_mermaid_blocks(content)
            if not blocks:
                print("⚠️  未找到Mermaid代码块")
                return False
            
            # 生成图片
            success_count = 0
            for block in blocks:
                output_path = self.images_dir / block['image_name']
                if self.generate_image(block['code'], str(output_path)):
                    success_count += 1
            
            if success_count == 0:
                print("❌ 没有成功生成任何图片")
                return False
            
            # 更新文档
            print("📝 更新文档...")
            updated_content = self.update_document(content, blocks)
            
            # 备份原文档
            backup_path = self.doc_path.with_suffix('.md.backup')
            with open(backup_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"💾 原文档已备份到: {backup_path}")
            
            # 保存更新后的文档
            with open(self.doc_path, 'w', encoding='utf-8') as f:
                f.write(updated_content)
            
            print(f"🎉 转换完成! 成功处理 {success_count}/{len(blocks)} 个图表")
            return True
            
        except Exception as e:
            print(f"❌ 转换过程中发生错误: {str(e)}")
            return False


def main():
    """主函数"""
    # 文档和图片目录路径
    doc_path = r"c:\Users\yzhinan\Desktop\人工标注平台\ai-quality-inspection-platform\docs\需求总集.md"
    images_dir = r"c:\Users\yzhinan\Desktop\人工标注平台\ai-quality-inspection-platform\docs\images"
    
    print("🚀 开始Mermaid到PNG转换...")
    print(f"📄 文档路径: {doc_path}")
    print(f"🖼️  图片目录: {images_dir}")
    print("-" * 50)
    
    # 创建转换器并执行转换
    converter = MermaidConverter(doc_path, images_dir)
    success = converter.convert()
    
    if success:
        print("\n✨ 转换成功完成!")
        print("📋 生成的文件:")
        images_path = Path(images_dir)
        for img_file in images_path.glob("*.png"):
            print(f"   - {img_file.name}")
    else:
        print("\n💥 转换失败，请检查错误信息")


if __name__ == "__main__":
    main()