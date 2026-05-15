#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Bob Sentinel Pitch Deck PDF Generator
Creates a professional PDF presentation
"""
import sys
import io

# Fix Windows console encoding
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from reportlab.lib.pagesizes import landscape, A4
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor, white, black
from reportlab.pdfgen import canvas
from reportlab.lib.utils import simpleSplit

# Page dimensions
WIDTH, HEIGHT = landscape(A4)

# Colors
BG_DARK = HexColor('#0a0e27')
ACCENT = HexColor('#667eea')
TEXT = white
TEXT_GRAY = HexColor('#a0a0a0')

def create_pitch_deck():
    filename = "Bob_Sentinel_Pitch_Deck.pdf"
    c = canvas.Canvas(filename, pagesize=landscape(A4))
    
    print("Generating Bob Sentinel Pitch Deck...")
    
    # Slide 1: Title
    c.setFillColor(BG_DARK)
    c.rect(0, 0, WIDTH, HEIGHT, fill=1, stroke=0)
    c.setFillColor(ACCENT)
    c.rect(0, HEIGHT - 8, WIDTH, 8, fill=1, stroke=0)
    
    # Shield icon removed for PDF compatibility
    
    c.setFillColor(ACCENT)
    c.setFont("Helvetica-Bold", 56)
    c.drawString(60, HEIGHT - 240, "Bob Sentinel")
    
    c.setFillColor(TEXT_GRAY)
    c.setFont("Helvetica", 24)
    c.drawString(60, HEIGHT - 280, "Real-time Security Scanner for IBM Bob")
    c.drawString(60, HEIGHT - 310, "Detect Vulnerabilities Before They Reach Production")
    
    c.setFillColor(TEXT_GRAY)
    c.setFont("Helvetica", 16)
    c.drawString(60, 60, "IBM Bob Hackathon 2026")
    
    c.setFillColor(ACCENT)
    c.setFont("Helvetica-Bold", 16)
    c.drawRightString(WIDTH - 40, 40, "1")
    
    c.showPage()
    print("[OK] Slide 1: Title")
    
    # Slide 2: The Problem
    c.setFillColor(BG_DARK)
    c.rect(0, 0, WIDTH, HEIGHT, fill=1, stroke=0)
    c.setFillColor(ACCENT)
    c.rect(0, HEIGHT - 8, WIDTH, 8, fill=1, stroke=0)
    
    c.setFillColor(ACCENT)
    c.setFont("Helvetica-Bold", 44)
    c.drawString(60, HEIGHT - 90, "The Problem")
    
    # Problem boxes
    box_width = (WIDTH - 180) / 2
    box_height = 120
    
    # Box 1
    c.setFillColor(HexColor('#667eea33'))
    c.setStrokeColor(ACCENT)
    c.setLineWidth(2)
    c.roundRect(60, HEIGHT - 260, box_width, box_height, 10, fill=1, stroke=1)
    c.setFillColor(ACCENT)
    c.setFont("Helvetica-Bold", 18)
    c.drawString(80, HEIGHT - 200, "🔴 Security Breaches")
    c.setFillColor(TEXT)
    c.setFont("Helvetica", 13)
    lines = simpleSplit("Vulnerabilities slip into production code, causing data breaches and financial losses", "Helvetica", 13, box_width - 40)
    y = HEIGHT - 225
    for line in lines:
        c.drawString(80, y, line)
        y -= 16
    
    # Box 2
    c.setFillColor(HexColor('#667eea33'))
    c.roundRect(WIDTH/2 + 30, HEIGHT - 260, box_width, box_height, 10, fill=1, stroke=1)
    c.setFillColor(ACCENT)
    c.setFont("Helvetica-Bold", 18)
    c.drawString(WIDTH/2 + 50, HEIGHT - 200, "⏰ Late Detection")
    c.setFillColor(TEXT)
    c.setFont("Helvetica", 13)
    lines = simpleSplit("Security issues discovered after deployment are 100x more expensive to fix", "Helvetica", 13, box_width - 40)
    y = HEIGHT - 225
    for line in lines:
        c.drawString(WIDTH/2 + 50, y, line)
        y -= 16
    
    # Box 3
    c.setFillColor(HexColor('#667eea33'))
    c.roundRect(60, HEIGHT - 410, box_width, box_height, 10, fill=1, stroke=1)
    c.setFillColor(ACCENT)
    c.setFont("Helvetica-Bold", 18)
    c.drawString(80, HEIGHT - 350, "👨‍💻 Developer Burden")
    c.setFillColor(TEXT)
    c.setFont("Helvetica", 13)
    lines = simpleSplit("Manual security reviews slow down development and miss critical issues", "Helvetica", 13, box_width - 40)
    y = HEIGHT - 375
    for line in lines:
        c.drawString(80, y, line)
        y -= 16
    
    # Box 4
    c.setFillColor(HexColor('#667eea33'))
    c.roundRect(WIDTH/2 + 30, HEIGHT - 410, box_width, box_height, 10, fill=1, stroke=1)
    c.setFillColor(ACCENT)
    c.setFont("Helvetica-Bold", 18)
    c.drawString(WIDTH/2 + 50, HEIGHT - 350, "🔧 Tool Fragmentation")
    c.setFillColor(TEXT)
    c.setFont("Helvetica", 13)
    lines = simpleSplit("Multiple disconnected security tools create workflow friction", "Helvetica", 13, box_width - 40)
    y = HEIGHT - 375
    for line in lines:
        c.drawString(WIDTH/2 + 50, y, line)
        y -= 16
    
    c.setFillColor(ACCENT)
    c.setFont("Helvetica-Bold", 16)
    c.drawRightString(WIDTH - 40, 40, "2")
    c.showPage()
    print("[OK] Slide 2: The Problem")
    
    # Slide 3: The Solution
    c.setFillColor(BG_DARK)
    c.rect(0, 0, WIDTH, HEIGHT, fill=1, stroke=0)
    c.setFillColor(ACCENT)
    c.rect(0, HEIGHT - 8, WIDTH, 8, fill=1, stroke=0)
    
    c.setFillColor(ACCENT)
    c.setFont("Helvetica-Bold", 44)
    c.drawString(60, HEIGHT - 90, "The Solution")
    
    c.setFillColor(TEXT)
    c.setFont("Helvetica", 18)
    c.drawString(60, HEIGHT - 140, "Bob Sentinel integrates directly into IBM Bob's workflow")
    
    bullets = [
        "Real-time scanning as you code with IBM Bob",
        "15+ vulnerability types detected instantly",
        "Beautiful dashboard with actionable insights",
        "Git hook integration blocks vulnerable code",
        "One-click installation across all platforms",
        "Zero configuration required to start"
    ]
    
    y = HEIGHT - 190
    for bullet in bullets:
        c.setFillColor(ACCENT)
        c.setFont("Helvetica-Bold", 18)
        c.drawString(80, y, "✓")
        c.setFillColor(TEXT)
        c.setFont("Helvetica", 16)
        c.drawString(110, y, bullet)
        y -= 35
    
    c.setFillColor(ACCENT)
    c.setFont("Helvetica-Bold", 16)
    c.drawRightString(WIDTH - 40, 40, "3")
    c.showPage()
    print("[OK] Slide 3: The Solution")
    
    # Slide 4: Key Features
    c.setFillColor(BG_DARK)
    c.rect(0, 0, WIDTH, HEIGHT, fill=1, stroke=0)
    c.setFillColor(ACCENT)
    c.rect(0, HEIGHT - 8, WIDTH, 8, fill=1, stroke=0)
    
    c.setFillColor(ACCENT)
    c.setFont("Helvetica-Bold", 44)
    c.drawString(60, HEIGHT - 90, "Key Features")
    
    # Feature boxes
    c.setFillColor(HexColor('#667eea33'))
    c.roundRect(60, HEIGHT - 260, box_width, box_height, 10, fill=1, stroke=1)
    c.setFillColor(ACCENT)
    c.setFont("Helvetica-Bold", 18)
    c.drawString(80, HEIGHT - 200, "⚡ Lightning Fast")
    c.setFillColor(TEXT)
    c.setFont("Helvetica", 13)
    lines = simpleSplit("Scans entire codebases in milliseconds using optimized regex patterns", "Helvetica", 13, box_width - 40)
    y = HEIGHT - 225
    for line in lines:
        c.drawString(80, y, line)
        y -= 16
    
    c.setFillColor(HexColor('#667eea33'))
    c.roundRect(WIDTH/2 + 30, HEIGHT - 260, box_width, box_height, 10, fill=1, stroke=1)
    c.setFillColor(ACCENT)
    c.setFont("Helvetica-Bold", 18)
    c.drawString(WIDTH/2 + 50, HEIGHT - 200, "🎯 Accurate Detection")
    c.setFillColor(TEXT)
    c.setFont("Helvetica", 13)
    lines = simpleSplit("15+ vulnerability types: SQL injection, XSS, hardcoded secrets, weak crypto", "Helvetica", 13, box_width - 40)
    y = HEIGHT - 225
    for line in lines:
        c.drawString(WIDTH/2 + 50, y, line)
        y -= 16
    
    c.setFillColor(HexColor('#667eea33'))
    c.roundRect(60, HEIGHT - 410, box_width, box_height, 10, fill=1, stroke=1)
    c.setFillColor(ACCENT)
    c.setFont("Helvetica-Bold", 18)
    c.drawString(80, HEIGHT - 350, "📊 Visual Dashboard")
    c.setFillColor(TEXT)
    c.setFont("Helvetica", 13)
    lines = simpleSplit("Real-time health scores, severity breakdown, and code diff viewer", "Helvetica", 13, box_width - 40)
    y = HEIGHT - 375
    for line in lines:
        c.drawString(80, y, line)
        y -= 16
    
    c.setFillColor(HexColor('#667eea33'))
    c.roundRect(WIDTH/2 + 30, HEIGHT - 410, box_width, box_height, 10, fill=1, stroke=1)
    c.setFillColor(ACCENT)
    c.setFont("Helvetica-Bold", 18)
    c.drawString(WIDTH/2 + 50, HEIGHT - 350, "🔗 Seamless Integration")
    c.setFillColor(TEXT)
    c.setFont("Helvetica", 13)
    lines = simpleSplit("Custom IBM Bob mode with chat commands and automatic scanning", "Helvetica", 13, box_width - 40)
    y = HEIGHT - 375
    for line in lines:
        c.drawString(WIDTH/2 + 50, y, line)
        y -= 16
    
    c.setFillColor(ACCENT)
    c.setFont("Helvetica-Bold", 16)
    c.drawRightString(WIDTH - 40, 40, "4")
    c.showPage()
    print("[OK] Slide 4: Key Features")
    
    # Slide 5: Technical Excellence
    c.setFillColor(BG_DARK)
    c.rect(0, 0, WIDTH, HEIGHT, fill=1, stroke=0)
    c.setFillColor(ACCENT)
    c.rect(0, HEIGHT - 8, WIDTH, 8, fill=1, stroke=0)
    
    c.setFillColor(ACCENT)
    c.setFont("Helvetica-Bold", 44)
    c.drawString(60, HEIGHT - 90, "Technical Excellence")
    
    # Stats boxes
    stat_width = (WIDTH - 240) / 3
    stat_height = 100
    
    c.setFillColor(HexColor('#667eea26'))
    c.roundRect(60, HEIGHT - 220, stat_width, stat_height, 10, fill=1, stroke=1)
    c.setFillColor(ACCENT)
    c.setFont("Helvetica-Bold", 40)
    c.drawCentredString(60 + stat_width/2, HEIGHT - 170, "50+")
    c.setFillColor(TEXT)
    c.setFont("Helvetica", 14)
    c.drawCentredString(60 + stat_width/2, HEIGHT - 195, "Files Created")
    
    c.setFillColor(HexColor('#667eea26'))
    c.roundRect(WIDTH/3 + 20, HEIGHT - 220, stat_width, stat_height, 10, fill=1, stroke=1)
    c.setFillColor(ACCENT)
    c.setFont("Helvetica-Bold", 40)
    c.drawCentredString(WIDTH/3 + 20 + stat_width/2, HEIGHT - 170, "11K+")
    c.setFillColor(TEXT)
    c.setFont("Helvetica", 14)
    c.drawCentredString(WIDTH/3 + 20 + stat_width/2, HEIGHT - 195, "Lines of Code")
    
    c.setFillColor(HexColor('#667eea26'))
    c.roundRect(2*WIDTH/3 - 20, HEIGHT - 220, stat_width, stat_height, 10, fill=1, stroke=1)
    c.setFillColor(ACCENT)
    c.setFont("Helvetica-Bold", 40)
    c.drawCentredString(2*WIDTH/3 - 20 + stat_width/2, HEIGHT - 170, "15+")
    c.setFillColor(TEXT)
    c.setFont("Helvetica", 14)
    c.drawCentredString(2*WIDTH/3 - 20 + stat_width/2, HEIGHT - 195, "Vulnerability Types")
    
    bullets = [
        "Production-ready code with zero mocks",
        "Real pattern matching, no AI dependencies",
        "Cross-platform: Windows, Linux, macOS",
        "Comprehensive docs: 7 guides, 3,000+ lines"
    ]
    
    y = HEIGHT - 280
    for bullet in bullets:
        c.setFillColor(ACCENT)
        c.setFont("Helvetica-Bold", 18)
        c.drawString(80, y, "✓")
        c.setFillColor(TEXT)
        c.setFont("Helvetica", 16)
        c.drawString(110, y, bullet)
        y -= 35
    
    c.setFillColor(ACCENT)
    c.setFont("Helvetica-Bold", 16)
    c.drawRightString(WIDTH - 40, 40, "5")
    c.showPage()
    print("[OK] Slide 5: Technical Excellence")
    
    # Slide 6: Built with IBM Bob
    c.setFillColor(BG_DARK)
    c.rect(0, 0, WIDTH, HEIGHT, fill=1, stroke=0)
    c.setFillColor(ACCENT)
    c.rect(0, HEIGHT - 8, WIDTH, 8, fill=1, stroke=0)
    
    c.setFillColor(ACCENT)
    c.setFont("Helvetica-Bold", 44)
    c.drawString(60, HEIGHT - 90, "Built 100% with IBM Bob")
    
    c.setFillColor(TEXT)
    c.setFont("Helvetica", 18)
    c.drawString(60, HEIGHT - 140, "This entire project was created through conversation with IBM Bob")
    
    c.setFillColor(HexColor('#667eea33'))
    c.roundRect(60, HEIGHT - 300, box_width, box_height, 10, fill=1, stroke=1)
    c.setFillColor(ACCENT)
    c.setFont("Helvetica-Bold", 18)
    c.drawString(80, HEIGHT - 240, "🤖 AI-Assisted")
    c.setFillColor(TEXT)
    c.setFont("Helvetica", 13)
    lines = simpleSplit("Complete project built in single conversation session", "Helvetica", 13, box_width - 40)
    y = HEIGHT - 265
    for line in lines:
        c.drawString(80, y, line)
        y -= 16
    
    c.setFillColor(HexColor('#667eea33'))
    c.roundRect(WIDTH/2 + 30, HEIGHT - 300, box_width, box_height, 10, fill=1, stroke=1)
    c.setFillColor(ACCENT)
    c.setFont("Helvetica-Bold", 18)
    c.drawString(WIDTH/2 + 50, HEIGHT - 240, "📝 Documented")
    c.setFillColor(TEXT)
    c.setFont("Helvetica", 13)
    lines = simpleSplit("BUILT_WITH_BOB.md proves AI-assisted development", "Helvetica", 13, box_width - 40)
    y = HEIGHT - 265
    for line in lines:
        c.drawString(WIDTH/2 + 50, y, line)
        y -= 16
    
    c.setFillColor(HexColor('#667eea33'))
    c.roundRect(60, HEIGHT - 450, box_width, box_height, 10, fill=1, stroke=1)
    c.setFillColor(ACCENT)
    c.setFont("Helvetica-Bold", 18)
    c.drawString(80, HEIGHT - 390, "🎯 Iterative")
    c.setFillColor(TEXT)
    c.setFont("Helvetica", 13)
    lines = simpleSplit("User feedback incorporated at every step", "Helvetica", 13, box_width - 40)
    y = HEIGHT - 415
    for line in lines:
        c.drawString(80, y, line)
        y -= 16
    
    c.setFillColor(HexColor('#667eea33'))
    c.roundRect(WIDTH/2 + 30, HEIGHT - 450, box_width, box_height, 10, fill=1, stroke=1)
    c.setFillColor(ACCENT)
    c.setFont("Helvetica-Bold", 18)
    c.drawString(WIDTH/2 + 50, HEIGHT - 390, "✅ Verified")
    c.setFillColor(TEXT)
    c.setFont("Helvetica", 13)
    lines = simpleSplit("Scanned with own security scanner before publication", "Helvetica", 13, box_width - 40)
    y = HEIGHT - 415
    for line in lines:
        c.drawString(WIDTH/2 + 50, y, line)
        y -= 16
    
    c.setFillColor(ACCENT)
    c.setFont("Helvetica-Bold", 16)
    c.drawRightString(WIDTH - 40, 40, "6")
    c.showPage()
    print("[OK] Slide 6: Built with IBM Bob")
    
    # Slide 7: Call to Action
    c.setFillColor(BG_DARK)
    c.rect(0, 0, WIDTH, HEIGHT, fill=1, stroke=0)
    c.setFillColor(ACCENT)
    c.rect(0, HEIGHT - 8, WIDTH, 8, fill=1, stroke=0)
    
    c.setFillColor(ACCENT)
    c.setFont("Helvetica-Bold", 44)
    c.drawString(60, HEIGHT - 90, "Get Started Today")
    
    c.setFillColor(TEXT)
    c.setFont("Helvetica", 20)
    c.drawString(60, HEIGHT - 150, "Make security scanning as easy as chatting with Bob")
    
    bullets = [
        "⭐ Star the repository",
        "📥 Try the one-click installer",
        "🔍 Scan your first project",
        "🤝 Contribute to the project",
        "📢 Share with your team"
    ]
    
    y = HEIGHT - 210
    for bullet in bullets:
        c.setFillColor(ACCENT)
        c.setFont("Helvetica-Bold", 18)
        c.drawString(80, y, bullet[0])
        c.setFillColor(TEXT)
        c.setFont("Helvetica", 18)
        c.drawString(110, y, bullet[2:])
        y -= 40
    
    # CTA Button
    button_width = 350
    button_height = 50
    button_x = (WIDTH - button_width) / 2
    button_y = 100
    
    c.setFillColor(ACCENT)
    c.roundRect(button_x, button_y, button_width, button_height, 10, fill=1, stroke=0)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 22)
    c.drawCentredString(WIDTH/2, button_y + 15, "Get Started Now →")
    
    c.setFillColor(ACCENT)
    c.setFont("Helvetica-Bold", 16)
    c.drawRightString(WIDTH - 40, 40, "7")
    c.showPage()
    print("[OK] Slide 7: Call to Action")
    
    # Slide 8: Thank You
    c.setFillColor(BG_DARK)
    c.rect(0, 0, WIDTH, HEIGHT, fill=1, stroke=0)
    c.setFillColor(ACCENT)
    c.rect(0, HEIGHT - 8, WIDTH, 8, fill=1, stroke=0)
    
    # Shield icon removed for PDF compatibility
    
    c.setFillColor(ACCENT)
    c.setFont("Helvetica-Bold", 60)
    c.drawString(60, HEIGHT - 240, "Thank You")
    
    c.setFillColor(TEXT_GRAY)
    c.setFont("Helvetica", 28)
    c.drawString(60, HEIGHT - 290, "Bob Sentinel - Security Made Simple")
    
    c.setFillColor(TEXT_GRAY)
    c.setFont("Helvetica", 18)
    c.drawString(60, HEIGHT - 360, "github.com/qubitpage/IBM-Bob-Sentinel-Security")
    
    c.setFillColor(ACCENT)
    c.setFont("Helvetica", 16)
    c.drawString(60, 60, "Built with love using IBM Bob")
    
    c.setFillColor(ACCENT)
    c.setFont("Helvetica-Bold", 16)
    c.drawRightString(WIDTH - 40, 40, "8")
    c.showPage()
    print("[OK] Slide 8: Thank You")
    
    c.save()
    print(f"\n[SUCCESS] PDF generated successfully: {filename}")
    print(f"[INFO] Total slides: 8")
    print(f"[INFO] Format: Landscape A4")
    print(f"[INFO] Location: {filename}")
    
    return filename

if __name__ == "__main__":
    create_pitch_deck()

# Made with Bob
