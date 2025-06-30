# 🎯 Quiz de Flashcards - Solidity & Web3

Uma plataforma moderna para estudar desenvolvimento Solidity e Web3 através de flashcards interativos.

## 🚀 **Demo ao Vivo**

Acesse: **[https://SEU_USUARIO.github.io/NOME_DO_REPO](https://seu-usuario.github.io/nome-do-repo)**

## ✨ **Funcionalidades**

- 🎲 **Quiz Interativo** com timer e estatísticas
- 📚 **Carregamento Inteligente** de flashcards (local → GitHub automaticamente)
- 📁 **Upload de Arquivos** personalizados
- 🔗 **URLs Personalizadas** para carregar de qualquer fonte
- 🎨 **Interface Moderna** e responsiva
- ⚙️ **Múltiplos Modos**: Aleatório, Sequencial, Prioridade
- 📊 **Estatísticas Detalhadas** com tempo por pergunta

## 🏃‍♂️ **Como Usar**

### **Opção 1: GitHub Pages (Recomendado)**
1. Acesse o link do demo acima
2. Clique em "🎯 Carregar Flashcards de Solidity"
3. Configure o quiz e comece a estudar!

### **Opção 2: Execução Local**

```bash
# Clone o repositório
git clone https://github.com/SEU_USUARIO/NOME_DO_REPO.git
cd NOME_DO_REPO

# Inicie um servidor local
npx http-server
# ou
python -m http.server 8000

# Acesse http://localhost:8000
```

## 📚 **Conteúdo de Estudo**

Os flashcards cobrem tópicos essenciais de Solidity:

- 🔧 **Design Patterns & Arquitetura**
- 🔐 **Segurança & Controle de Acesso** 
- ⚡ **Otimização & Boas Práticas**
- 📜 **Padrões Importantes (EIPs)**

Para estudar teoria detalhada: [📖 Conteúdo Completo](content.md)

## 🔧 **Configuração do GitHub Pages**

Para hospedar seu próprio quiz: [📘 Guia Completo](GITHUB_PAGES_SETUP.md)

## 📝 **Formato dos Flashcards**

```json
[
  {
    "id": 1,
    "question": "O que é Separação de Lógica e Dados?",
    "options": [
      "Dividir contrato em armazenamento e lógica para upgrades",
      "Juntar tudo num contrato único",
      "Separar por função sem persistência",
      "Usar apenas proxies"
    ],
    "correct_answer": 0,
    "explanation": "Permite upgrades mantendo o estado dos dados."
  }
]
```

## 🛠️ **Tecnologias**

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Hosting**: GitHub Pages
- **Dados**: JSON (local ou remoto)
- **Design**: Responsivo, mobile-first

## 🤝 **Contribuindo**

1. Fork o projeto
2. Crie uma branch: `git checkout -b feature/nova-funcionalidade`
3. Commit: `git commit -m 'Adiciona nova funcionalidade'`
4. Push: `git push origin feature/nova-funcionalidade`
5. Abra um Pull Request

## 📄 **Licença**

MIT License - veja [LICENSE](LICENSE) para detalhes.

---

**💡 Dica**: Para adicionar seus próprios flashcards, edite o arquivo `flashcards.json` ou use a opção de upload na interface!
