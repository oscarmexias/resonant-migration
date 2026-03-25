#!/bin/bash
# Script de instalación GLOBAL de Claude Code Skills
# Por: Oscar Mejía
# Ejecutable desde CUALQUIER ubicación en tu Mac

set -e  # Detener en caso de error

echo "🚀 Instalando Claude Code Skills (GLOBAL)"
echo "=========================================="
echo "📍 Ubicación: ~/.claude/skills/"
echo "🌍 Disponible para TODOS tus proyectos"
echo ""

# Ir directamente al directorio global
SKILLS_DIR="$HOME/.claude/skills"
mkdir -p "$SKILLS_DIR"
cd "$SKILLS_DIR"

echo "📂 Directorio de trabajo: $SKILLS_DIR"
echo ""

# 1. Skills Oficiales de Anthropic
echo "📦 Instalando Anthropic Skills..."
if [ ! -d "$SKILLS_DIR/pdf" ]; then
  echo "  → Descargando desde GitHub..."
  git clone --depth=1 https://github.com/anthropics/skills.git anthropic-temp
  echo "  → Copiando skills individuales..."
  cp -r anthropic-temp/skills/* "$SKILLS_DIR/"
  rm -rf anthropic-temp
  echo "  ✅ 14 skills instalados"
else
  echo "  ✅ Ya instalados (saltando)"
fi
echo ""

# 2. Claude-mem (Memoria Persistente)
echo "🧠 Instalando claude-mem..."
if [ ! -d "$SKILLS_DIR/claude-mem" ]; then
  echo "  → Descargando desde GitHub..."
  git clone https://github.com/thedotmack/claude-mem.git "$SKILLS_DIR/claude-mem"
  cd "$SKILLS_DIR/claude-mem"
  echo "  → Instalando dependencias..."
  npm install --silent 2>/dev/null || echo "  ⚠️  npm install falló, continuando..."
  cd "$SKILLS_DIR"
  echo "  ✅ claude-mem instalado"
else
  echo "  ✅ Ya instalado (saltando)"
fi
echo ""

# 3. CCPM (Claude Code PM)
echo "📋 Instalando CCPM..."
if [ ! -d "$SKILLS_DIR/ccpm" ]; then
  echo "  → Descargando desde GitHub..."
  git clone https://github.com/automazeio/ccpm.git "$SKILLS_DIR/ccpm"
  cd "$SKILLS_DIR/ccpm"
  echo "  → Configurando CCPM..."
  npm install --silent 2>/dev/null || echo "  ℹ️  CCPM no necesita npm install"
  cd "$SKILLS_DIR"
  echo "  ✅ CCPM instalado"
else
  echo "  ✅ Ya instalado (saltando)"
fi
echo ""

# Volver a home
cd "$HOME"

# 4. Verificación
echo "=========================================="
echo "🔍 Verificación de Instalación"
echo "=========================================="

# Contar skills
SKILL_COUNT=$(find "$SKILLS_DIR" -name "SKILL.md" -type f 2>/dev/null | wc -l | tr -d ' ')
echo ""
echo "✅ Skills instalados: $SKILL_COUNT"
echo "📍 Ubicación: $SKILLS_DIR"
echo ""

# Listar primeros 20 skills
echo "📂 Skills disponibles:"
ls -1 "$SKILLS_DIR" | grep -v "\.git" | head -20
echo ""

# Verificar Claude Code
if command -v claude &> /dev/null; then
  echo "✅ Claude Code detectado"
  claude --version
else
  echo "⚠️  Claude Code CLI no encontrado"
  echo "   Instálalo desde: https://claude.com/code"
fi

echo ""
echo "=========================================="
echo "✨ INSTALACIÓN COMPLETADA"
echo "=========================================="
echo ""
echo "🌍 GLOBAL = Disponible en TODOS los proyectos"
echo ""
echo "📖 Cómo usar:"
echo ""
echo "1️⃣  Abre Claude Code en CUALQUIER proyecto:"
echo "    cd ~/tu-proyecto"
echo "    claude"
echo ""
echo "2️⃣  Ver skills disponibles:"
echo "    /skills list"
echo ""
echo "3️⃣  Usar skills (ejemplos):"
echo "    /pm:prd-new          → Crear PRD"
echo "    /mem-search 'bug'    → Buscar en memoria"
echo "    /pdf                 → Trabajar con PDF"
echo "    /docx                → Crear Word docs"
echo ""
echo "💡 Claude sugerirá skills automáticamente cuando sean relevantes"
echo ""
echo "🎉 ¡Nunca más necesitas instalar skills!"
