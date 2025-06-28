

## ✅ TÓPICOS PRIORITÁRIOS NUMERADOS

---

### 🔧 Design Patterns & Arquitetura

1. Separação de Lógica e Dados (Diamond Proxy vs Modular Contracts)
2. Upgradeability Patterns (Transparent vs UUPS Proxy, EIP-1967 slots)
3. Factory Contracts & Clone Patterns (EIP-1167 - Minimal Proxies)
4. Storage Layout Optimization (herança, packing, mappings vs arrays)
5. Dependency Injection & Composability (como contratos se comunicam)
6. Lifecycle Management (initialization, pausable, self-destruct)

---

### 🔐 Segurança & Controle de Acesso

7. Reentrancy Patterns (Checks-Effects-Interactions, reentrancy guards)
8. Access Control (Ownable, RBAC, multi-signature)
9. Circuit Breaker & Emergency Stops (quando usar pause())
10. Front-running Mitigations (commit-reveal, gas auctions)

---

### ⚡ Otimização & Boas Práticas

11. Gas Optimization (view/pure, storage vs memory, loop optimizations)
12. Pull over Push Payments (evitar chamadas ativas a usuários)
13. Event-Driven Design (quando usar eventos vs storage)
14. Fallback Functions & Receive ETH (padrões seguros)

---

### 📜 Padrões Importantes (EIPs)

15. Proxies (EIP-1967, EIP-1822)
16. ERC-20/ERC-721/ERC-1155 (quando usar cada um)
17. EIP-712 (Signed Messages) para meta-transactions
18. EIP-2612 (Permit) para approvals sem gas

---

## 🧱 EXPLICAÇÃO COMPLETA – **Design Patterns & Arquitetura**

### 1. Separação de Lógica e Dados

**Por quê?**
Separar lógica e dados permite atualizar contratos sem perder o estado.
Ex: usar um contrato para guardar `storage`, e outro com a `logic`, usando proxies para delegar chamadas.

**Padrões comuns:**

* **Diamond Standard (EIP-2535):** múltiplas "facets" de lógica em um só proxy
  - Permite adicionar/remover funcionalidades de forma modular
  - Suporta contratos grandes que excedem o limite de bytecode (24KB)
  - Cada facet é um contrato separado com funções específicas
* **Modular Contracts:** contratos separados comunicando-se via interfaces
  - Menor complexidade comparado ao Diamond
  - Mais fácil de auditar e testar
  - Melhor para casos onde não há necessidade de muitas funcionalidades

```solidity
// Padrão de Armazenamento Simples
contract DataStorage {
    uint public value;
    address public owner;
    mapping(address => uint) public balances;
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    function setValue(uint _v) external onlyOwner {
        value = _v;
    }
}

// Diamond Pattern - Facet de exemplo
contract CalculatorFacet {
    function add(uint a, uint b) external pure returns (uint) {
        return a + b;
    }
    
    function multiply(uint a, uint b) external pure returns (uint) {
        return a * b;
    }
}

// Interface para comunicação entre contratos
interface IDataStorage {
    function getValue() external view returns (uint);
    function setValue(uint _value) external;
}

contract LogicContract {
    IDataStorage public immutable dataContract;
    
    constructor(address _dataContract) {
        dataContract = IDataStorage(_dataContract);
    }
    
    function processData(uint newValue) external {
        uint currentValue = dataContract.getValue();
        uint processedValue = currentValue * 2 + newValue;
        dataContract.setValue(processedValue);
    }
}
```

---

### 2. Upgradeability Patterns

**Transparent Proxy vs UUPS Proxy**

* **Transparent Proxy:** lógica no proxy é fixa, upgrades via admin
  - Proxy contém a lógica de upgrade
  - Admin e usuários interagem de forma diferente para evitar colisões
  - Mais gas por chamada devido às verificações de admin
* **UUPS Proxy:** lógica de upgrade está no próprio contrato de lógica (`upgradeTo()`), com segurança extra
  - Menor gas por chamada
  - Risco de "brick" o contrato se implementação não tiver função de upgrade
  - Mais eficiente para uso em produção

**Storage Slots (EIP-1967):**
* Implementation: `0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc`
* Admin: `0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103`
* Beacon: `0xa3f0ad74e5423aebfd80d3ef4346578335a9a72aeaee59ff6cb3582b35133d50`

```solidity
// Exemplo completo com OpenZeppelin (UUPS)
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract MyLogicV1 is Initializable, UUPSUpgradeable, OwnableUpgradeable {
    uint public value;
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }
    
    function initialize(address initialOwner) public initializer {
        __Ownable_init();
        __UUPSUpgradeable_init();
        _transferOwnership(initialOwner);
    }
    
    function setValue(uint _value) external onlyOwner {
        value = _value;
    }
    
    function _authorizeUpgrade(address newImplementation) 
        internal 
        override 
        onlyOwner 
    {}
    
    function getVersion() external pure returns (string memory) {
        return "v1.0.0";
    }
}

// Versão 2 com nova funcionalidade
contract MyLogicV2 is MyLogicV1 {
    uint public multiplier;
    
    function setMultiplier(uint _multiplier) external onlyOwner {
        multiplier = _multiplier;
    }
    
    function getMultipliedValue() external view returns (uint) {
        return value * multiplier;
    }
    
    function getVersion() external pure override returns (string memory) {
        return "v2.0.0";
    }
}
```

**⚠️ Cuidados Críticos com Storage Layout:**

```solidity
// ❌ ERRADO - mudança no layout quebra o contrato
contract V1 {
    uint public a;
    uint public b;
}

contract V2 {
    uint public b;  // ERRO: mudou a posição!
    uint public a;
    uint public c;
}

// ✅ CORRETO - mantém layout compatível
contract V1 {
    uint public a;
    uint public b;
}

contract V2 {
    uint public a;  // mesma posição
    uint public b;  // mesma posição
    uint public c;  // novo campo no final
}
```

---

### 3. Factory Contracts & Clone Patterns

* **Factory Pattern:** contrato que cria outros contratos
  - Útil para criar múltiplas instâncias de contratos similares
  - Pode pre-configurar contratos na criação
  - Facilita o gerenciamento e rastreamento de contratos criados
* **Clone Pattern (EIP-1167):** cria contratos minimalistas que delegam para um template (muito mais baratos)
  - Economiza ~99% do gas comparado ao deployment normal
  - Todos os clones compartilham o mesmo código
  - Cada clone tem seu próprio storage

**Comparação de custos:**
- Deployment normal: ~2M gas
- Clone (EIP-1167): ~40k gas

```solidity
import "@openzeppelin/contracts/proxy/Clones.sol";

// Template contract
contract TokenTemplate {
    string public name;
    string public symbol;
    address public owner;
    bool private initialized;
    
    function initialize(
        string memory _name,
        string memory _symbol,
        address _owner
    ) external {
        require(!initialized, "Already initialized");
        name = _name;
        symbol = _symbol;
        owner = _owner;
        initialized = true;
    }
}

// Factory para criar tokens
contract TokenFactory {
    address public immutable tokenTemplate;
    address[] public allTokens;
    mapping(address => bool) public isToken;
    
    event TokenCreated(address indexed token, address indexed owner);
    
    constructor() {
        tokenTemplate = address(new TokenTemplate());
    }
    
    function createToken(
        string calldata name,
        string calldata symbol
    ) external returns (address) {
        // Cria um clone minimal proxy
        address clone = Clones.clone(tokenTemplate);
        
        // Inicializa o clone
        TokenTemplate(clone).initialize(name, symbol, msg.sender);
        
        // Registra o novo token
        allTokens.push(clone);
        isToken[clone] = true;
        
        emit TokenCreated(clone, msg.sender);
        return clone;
    }
    
    function getAllTokens() external view returns (address[] memory) {
        return allTokens;
    }
    
    function getTokenCount() external view returns (uint) {
        return allTokens.length;
    }
}

// Factory com CREATE2 para endereços determinísticos
contract DeterministicFactory {
    address public immutable template;
    
    constructor(address _template) {
        template = _template;
    }
    
    function createClone(bytes32 salt) external returns (address) {
        return Clones.cloneDeterministic(template, salt);
    }
    
    function predictAddress(bytes32 salt) external view returns (address) {
        return Clones.predictDeterministicAddress(template, salt);
    }
}
```

---

### 4. Storage Layout Optimization

**Boas práticas:**

* Agrupar variáveis do mesmo tipo (packing)
* Colocar `bool` no final quando possível
* Preferir `mapping` a `array` quando acesso é esparso
* Usar `bytes32` em vez de `string` para identificadores fixos
* Considerar `struct` packing para dados relacionados

**Conceitos importantes:**
- **Storage slots:** cada slot tem 32 bytes (256 bits)
- **Packing:** múltiplas variáveis pequenas podem compartilhar um slot
- **Inheritance:** variáveis de contratos pai vêm primeiro

```solidity
// ❌ Não otimizado - usa 3 slots
struct BadExample {
    bool isActive;    // slot 0 (ocupa 32 bytes inteiros)
    uint256 amount;   // slot 1
    bool isVerified;  // slot 2 (ocupa 32 bytes inteiros)
}

// ✅ Otimizado - usa 2 slots
struct GoodExample {
    uint256 amount;   // slot 0
    bool isActive;    // slot 1 (compartilhado)
    bool isVerified;  // slot 1 (compartilhado)
}

// ✅ Ainda melhor - usa 1 slot para dados pequenos
struct OptimalExample {
    uint128 amount;   // slot 0 (16 bytes)
    uint64 timestamp; // slot 0 (8 bytes)
    uint32 id;        // slot 0 (4 bytes)
    bool isActive;    // slot 0 (1 byte)
    bool isVerified;  // slot 0 (1 byte)
    // ainda sobram 2 bytes neste slot
}

// Exemplo prático de contrato otimizado
contract OptimizedStorage {
    // Layout cuidadosamente planejado
    address public owner;        // slot 0 (20 bytes)
    uint96 public totalSupply;   // slot 0 (12 bytes) - total: 32 bytes
    
    uint128 public price;        // slot 1 (16 bytes)
    uint64 public lastUpdate;    // slot 1 (8 bytes)
    uint32 public maxUsers;      // slot 1 (4 bytes)
    bool public paused;          // slot 1 (1 byte)
    bool public initialized;     // slot 1 (1 byte)
    // slot 1 ainda tem 2 bytes livres
    
    // Mappings sempre ocupam novos slots
    mapping(address => uint256) public balances;     // slot 2
    mapping(address => bool) public whitelist;       // slot 3
    
    // Arrays dinâmicos
    address[] public users;      // slot 4 (armazena length)
    // dados dos arrays ficam em keccak256(slot)
    
    // Constantes não ocupam storage
    uint256 public constant MAX_SUPPLY = 1000000;
    
    // Immutable são armazenadas no bytecode
    uint256 public immutable deploymentTime;
    
    constructor() {
        deploymentTime = block.timestamp;
    }
}

// Análise de custos de storage
contract StorageCosts {
    // SSTORE operations:
    // - Zero to non-zero: 20,000 gas
    // - Non-zero to non-zero: 5,000 gas
    // - Non-zero to zero: 5,000 gas (+ 15,000 refund)
    
    uint256 private value1; // primeira escrita: 20k gas
    uint256 private value2;
    
    function expensiveWrite() external {
        value1 = 100; // 20,000 gas (zero -> non-zero)
        value2 = 200; // 20,000 gas
    }
    
    function cheaperWrite() external {
        value1 = 150; // 5,000 gas (non-zero -> non-zero)
        value2 = 250; // 5,000 gas
    }
    
    function deleteValue() external {
        value1 = 0; // 5,000 gas + 15,000 refund
    }
}
```

---

### 5. Dependency Injection & Composability

* **Injeção de dependência:** passar contratos como parâmetros
* **Composability:** contratos interagindo entre si via interfaces

```solidity
interface IOracle {
    function getPrice() external view returns (uint);
}

contract Consumer {
    IOracle public oracle;
    constructor(address _oracle) {
        oracle = IOracle(_oracle);
    }
}
```

---

### 6. Lifecycle Management

Gerenciar o ciclo de vida do contrato:

* **Initializer:** usado em proxies em vez de `constructor`
* **Pausable:** permite pausar operações críticas
* **Self-destruct:** encerra e envia saldo a um endereço

```solidity
contract MyContract is Initializable, Pausable {
    function initialize() public initializer {
        // init code
    }

    function pause() public onlyOwner {
        _pause();
    }

    function kill() public onlyOwner {
        selfdestruct(payable(owner()));
    }
}
```

---

Se quiser, posso fazer o mesmo com os próximos conjuntos (segurança, otimização ou EIPs). Quer que eu prepare a explicação do grupo **"Segurança & Controle de Acesso"** agora?
Ótimo! Aqui está o bloco completo e detalhado em **Markdown** com explicações, exemplos e boas práticas sobre o grupo:

---

## 🔐 Segurança & Controle de Acesso

---

### 7. Reentrancy Patterns

**O que é?**
Ataques onde um contrato malicioso chama novamente uma função antes que a execução anterior termine — e explora o estado inacabado.

**Mitigação:**

* **Pattern: Checks → Effects → Interactions**
* **Uso de reentrancy guard** (`nonReentrant` do OpenZeppelin)

```solidity
// Vulnerável
function withdraw() public {
    require(balances[msg.sender] > 0);
    (bool sent, ) = msg.sender.call{value: balances[msg.sender]}("");
    require(sent);
    balances[msg.sender] = 0;
}

// Correto
function withdraw() public nonReentrant {
    uint amount = balances[msg.sender];
    balances[msg.sender] = 0; // EFFECTS
    (bool sent, ) = msg.sender.call{value: amount}(""); // INTERACTION
    require(sent);
}
```

---

### 8. Access Control (Ownable, RBAC, Multisig)

**Ownable:** apenas o `owner` pode executar funções críticas.
**RBAC (Role-Based Access Control):** múltiplos papéis, como `ADMIN_ROLE`, `MINTER_ROLE`.
**Multisig:** decisões sensíveis só são feitas com múltiplas assinaturas.

```solidity
// Ownable
contract MyContract is Ownable {
    function onlyOwnerCanDo() public onlyOwner {
        // ...
    }
}

// RBAC
contract MyContract is AccessControl {
    bytes32 public constant EDITOR_ROLE = keccak256("EDITOR_ROLE");

    constructor() {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function editSomething() public onlyRole(EDITOR_ROLE) {
        // ...
    }
}
```

---

### 9. Circuit Breaker & Emergency Stops

**Pausable Contracts** permitem interromper funcionalidades críticas em caso de bugs, ataques ou emergência.
Use o padrão `whenNotPaused()` / `whenPaused()`.

```solidity
contract EmergencyStop is Pausable, Ownable {
    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    function sensitiveAction() public whenNotPaused {
        // Executado apenas quando o contrato está ativo
    }
}
```

---

### 10. Front-running Mitigations

**Problema:** alguém observa sua transação na mempool e envia uma versão com mais gas antes que a sua seja minerada.

**Mitigações:**

* **Commit-Reveal Schemes:** separar intenção (`commit()`) da ação final (`reveal()`), protegendo dados sensíveis.
* **Gas Auctions:** definir limites de tempo e condições para prevenir brigas por execução.

```solidity
// Commit-Reveal
mapping(address => bytes32) public commits;

function commit(bytes32 hash) public {
    commits[msg.sender] = hash;
}

function reveal(uint value, string memory secret) public {
    require(commits[msg.sender] == keccak256(abi.encodePacked(value, secret)));
    // seguir com lógica agora que o valor foi revelado
}
```

---

### 🛡️ Boas Práticas Gerais de Segurança

* Use **OpenZeppelin Contracts** sempre que possível (auditados e seguros)
* Limite quem pode **chamar funções críticas** (`onlyOwner`, `onlyRole`)
* Valide sempre os **entradas de usuários**
* Adicione **testes para ataques conhecidos** (reentrância, overflows, frontrunning)
* Acompanhe **ferramentas de análise estática**, como Slither e MythX

---

Se quiser, posso gerar agora o próximo conjunto:
👉 **⚡ Otimização & Boas Práticas**

Quer que eu siga?
Perfeito! Aqui está o bloco completo com explicações e exemplos do conjunto:

---

## ⚡ Otimização & Boas Práticas

---

### 11. Gas Optimization

**Motivo:** otimizar uso de gas reduz custos e melhora desempenho.
Foque em reduzir operações de armazenamento e repetição desnecessária.

**Práticas recomendadas:**

* Use `view` e `pure` quando não alterar o estado
* Prefira `calldata` a `memory` para parâmetros externos
* Prefira `memory` a `storage` para variáveis temporárias
* Evite loops desnecessários
* Compacte variáveis (packing) e evite tipos grandes quando não necessário
* Use `immutable` e `constant` sempre que possível
* Considere `unchecked{}` para operações seguras
* Cache storage variables em memory quando usado múltiplas vezes

**Custos de operações (aproximados):**
- SLOAD (ler storage): 2,100 gas
- SSTORE (escrever storage zero->non-zero): 20,000 gas
- SSTORE (escrever storage non-zero->non-zero): 5,000 gas
- Memory operation: 3 gas
- Calldata read: 4 gas

```solidity
// ❌ Ineficiente
contract Inefficient {
    uint public totalUsers;
    mapping(address => uint) public balances;
    
    function badFunction(uint[] memory data) public {
        for (uint i = 0; i < data.length; i++) {
            // Lê storage a cada iteração (2,100 gas cada)
            totalUsers = totalUsers + 1;
            
            // Múltiplas escritas em storage
            balances[msg.sender] = balances[msg.sender] + data[i];
        }
    }
    
    function anotherBadFunction(address[] memory users) public view returns (uint) {
        uint sum = 0;
        for (uint i = 0; i < users.length; i++) {
            // Lê storage em cada iteração
            sum += balances[users[i]];
        }
        return sum;
    }
}

// ✅ Mais eficiente
contract Efficient {
    uint public totalUsers;
    mapping(address => uint) public balances;
    
    function goodFunction(uint[] calldata data) external {
        // Cache storage variable
        uint _totalUsers = totalUsers;
        uint _balance = balances[msg.sender];
        
        // Loop otimizado
        uint length = data.length;
        for (uint i; i < length;) {
            _totalUsers++;
            _balance += data[i];
            
            unchecked { ++i; } // Mais eficiente que i++
        }
        
        // Escreve no storage apenas uma vez
        totalUsers = _totalUsers;
        balances[msg.sender] = _balance;
    }
    
    function efficientSum(address[] calldata users) 
        external 
        view 
        returns (uint sum) 
    {
        uint length = users.length;
        for (uint i; i < length;) {
            sum += balances[users[i]];
            unchecked { ++i; }
        }
    }
    
    // Usando assembly para operações críticas
    function efficientPacking(uint128 a, uint128 b) 
        external 
        pure 
        returns (uint256 packed) 
    {
        assembly {
            packed := or(shl(128, a), b)
        }
    }
}

// Técnicas avançadas de otimização
contract AdvancedOptimizations {
    // Use eventos em vez de storage para dados históricos
    event DataUpdated(address indexed user, uint256 value, uint256 timestamp);
    
    // Bitwise operations para flags
    uint256 private flags; // pode armazenar 256 flags diferentes
    
    function setFlag(uint8 flagIndex, bool value) external {
        if (value) {
            flags |= (1 << flagIndex);
        } else {
            flags &= ~(1 << flagIndex);
        }
    }
    
    function getFlag(uint8 flagIndex) external view returns (bool) {
        return (flags >> flagIndex) & 1 == 1;
    }
    
    // Short-circuit conditions (mais barato primeiro)
    function efficientConditions(address user, uint amount) external view returns (bool) {
        // Verifica condições baratas primeiro
        return amount > 0 && 
               user != address(0) && 
               balances[user] >= amount; // storage read por último
    }
    
    // Custom errors (mais baratos que strings)
    error InsufficientBalance(uint256 required, uint256 available);
    error InvalidAddress();
    
    function optimizedTransfer(address to, uint amount) external {
        if (to == address(0)) revert InvalidAddress();
        
        uint balance = balances[msg.sender];
        if (balance < amount) {
            revert InsufficientBalance(amount, balance);
        }
        
        // ...resto da lógica
    }
}
```

---

### 12. Pull over Push Payments

**Problema:** pagamentos automáticos (push) podem falhar e consumir gas à toa.
**Solução:** use o padrão **pull** — o usuário saca os fundos manualmente.

```solidity
// Push (evitar)
function payWinner(address winner) public {
    (bool sent, ) = winner.call{value: 1 ether}("");
    require(sent, "Failed");
}

// Pull (melhor)
mapping(address => uint) public pendingWithdrawals;

function reward(address winner) public {
    pendingWithdrawals[winner] += 1 ether;
}

function withdraw() public {
    uint amount = pendingWithdrawals[msg.sender];
    pendingWithdrawals[msg.sender] = 0;
    (bool sent, ) = msg.sender.call{value: amount}("");
    require(sent);
}
```

---

### 13. Event-Driven Design

**Eventos** são mais baratos que `storage` e ideais para registrar histórico de ações.
Use `events` para logs, e `storage` apenas para dados ativos necessários na lógica.

```solidity
event Transferred(address indexed from, address indexed to, uint amount);

function transfer(address to, uint amount) public {
    balances[msg.sender] -= amount;
    balances[to] += amount;
    emit Transferred(msg.sender, to, amount); // usado para auditoria e front-end
}
```

---

### 14. Fallback Functions & Receive ETH

* `receive()` é acionado quando o contrato recebe ETH sem `data`.
* `fallback()` é acionado quando não há função correspondente (ex: chamada errada ou proxy).
* Cuidado com `fallback` + `delegatecall`: podem permitir ataques se não forem bem protegidos.

```solidity
// Recebe ETH diretamente
receive() external payable {
    emit Received(msg.sender, msg.value);
}

// Fallback para chamadas erradas
fallback() external payable {
    emit FallbackCalled(msg.sender, msg.value);
}
```

---

### ⚠️ Cuidados extras de otimização

* Não use `require(x == true)`, use apenas `require(x)`
* Use constantes (`constant`, `immutable`) para valores fixos
* Use `unchecked {}` para operações que não precisam de verificação de overflow (a partir do Solidity 0.8+)

```solidity
function increment(uint x) public pure returns (uint) {
    unchecked {
        return x + 1;
    }
}
```

---

Pronto! 🎯
Quer que eu continue com o último grupo?
📜 **Padrões Importantes (EIPs)**?
Claro! Aqui está o bloco completo para o último grupo:

---

## 📜 Padrões Importantes (EIPs)

---

### 15. Proxies (EIP-1967, EIP-1822)

**O que são?**
Padrões para proxies que facilitam o upgrade do contrato mantendo o estado (storage).

* **EIP-1967:** define slots de armazenamento fixos para apontar para o contrato de lógica (implementation address), evitando colisões.
* **EIP-1822 (UUPS):** o próprio contrato lógico tem o método para realizar upgrades.

```solidity
// Exemplo simplificado de proxy (EIP-1967)
bytes32 private constant _IMPLEMENTATION_SLOT = keccak256("eip1967.proxy.implementation") - 1;

function _implementation() internal view returns (address impl) {
    bytes32 slot = _IMPLEMENTATION_SLOT;
    assembly {
        impl := sload(slot)
    }
}
```

---

### 16. ERC-20 / ERC-721 / ERC-1155

**Quando usar cada um?**

* **ERC-20:** tokens fungíveis (ex: moedas, stablecoins, utility tokens)
  - Todos os tokens são idênticos e intercambiáveis
  - Divisíveis (podem ter decimais)
  - Usados para: moedas, pontos de recompensa, governance tokens
* **ERC-721:** tokens não fungíveis (NFTs, itens únicos)
  - Cada token é único e tem ID próprio
  - Indivisíveis
  - Usados para: arte digital, colecionáveis, certificados, imóveis
* **ERC-1155:** tokens multi-token, podem representar fungíveis e não fungíveis no mesmo contrato
  - Eficiência de gas para múltiplos tipos de token
  - Batch transfers
  - Usados para: games (itens + moedas), marketplaces complexos

**Exemplos completos:**

```solidity
// ERC-20 Completo
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MyToken is ERC20, Ownable {
    uint8 private _decimals;
    uint256 public maxSupply;
    
    constructor(
        string memory name,
        string memory symbol,
        uint8 decimals_,
        uint256 initialSupply,
        uint256 maxSupply_
    ) ERC20(name, symbol) {
        _decimals = decimals_;
        maxSupply = maxSupply_;
        _mint(msg.sender, initialSupply * 10**decimals_);
    }
    
    function decimals() public view override returns (uint8) {
        return _decimals;
    }
    
    function mint(address to, uint256 amount) public onlyOwner {
        require(totalSupply() + amount <= maxSupply, "Max supply exceeded");
        _mint(to, amount);
    }
    
    function burn(uint256 amount) public {
        _burn(msg.sender, amount);
    }
}

// ERC-721 Completo
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract MyNFT is ERC721, ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    
    uint256 public maxSupply;
    uint256 public mintPrice;
    
    constructor(
        string memory name,
        string memory symbol,
        uint256 maxSupply_,
        uint256 mintPrice_
    ) ERC721(name, symbol) {
        maxSupply = maxSupply_;
        mintPrice = mintPrice_;
    }
    
    function mint(address to, string memory uri) public payable {
        require(_tokenIds.current() < maxSupply, "Max supply reached");
        require(msg.value >= mintPrice, "Insufficient payment");
        
        _tokenIds.increment();
        uint256 tokenId = _tokenIds.current();
        
        _mint(to, tokenId);
        _setTokenURI(tokenId, uri);
    }
    
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }
    
    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }
    
    function withdraw() public onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}

// ERC-1155 Completo
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MyMultiToken is ERC1155, Ownable {
    // Token IDs
    uint256 public constant GOLD = 0;
    uint256 public constant SILVER = 1;
    uint256 public constant BRONZE = 2;
    uint256 public constant RARE_SWORD = 1000;
    uint256 public constant EPIC_ARMOR = 1001;
    
    mapping(uint256 => uint256) public maxSupply;
    mapping(uint256 => string) public tokenURIs;
    
    constructor() ERC1155("https://api.mygame.com/token/{id}.json") {}
    
    function setTokenURI(uint256 tokenId, string memory newURI) public onlyOwner {
        tokenURIs[tokenId] = newURI;
    }
    
    function uri(uint256 tokenId) public view override returns (string memory) {
        return tokenURIs[tokenId];
    }
    
    function mint(
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) public onlyOwner {
        require(
            maxSupply[id] == 0 || totalSupply(id) + amount <= maxSupply[id],
            "Max supply exceeded"
        );
        _mint(to, id, amount, data);
    }
    
    function mintBatch(
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) public onlyOwner {
        _mintBatch(to, ids, amounts, data);
    }
    
    function setMaxSupply(uint256 tokenId, uint256 max) public onlyOwner {
        maxSupply[tokenId] = max;
    }
    
    // Função helper para verificar supply total
    mapping(uint256 => uint256) private _totalSupply;
    
    function totalSupply(uint256 id) public view returns (uint256) {
        return _totalSupply[id];
    }
    
    function _mint(
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) internal override {
        super._mint(to, id, amount, data);
        _totalSupply[id] += amount;
    }
    
    function _mintBatch(
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal override {
        super._mintBatch(to, ids, amounts, data);
        for (uint256 i = 0; i < ids.length; i++) {
            _totalSupply[ids[i]] += amounts[i];
        }
    }
}
```

---

### 17. EIP-712 (Signed Messages)

Permite criar mensagens assinadas off-chain com estrutura, para serem verificadas on-chain. Muito usado para:

* Meta-transactions (alguém paga o gas pela transação do usuário)
* Permissões via assinatura (gasless approvals)
* Voting systems off-chain
* Ordenação de dados estruturados

**Conceitos importantes:**
- **Domain Separator:** identifica unicamente o contexto da aplicação
- **TypeHash:** hash da estrutura dos dados
- **Structured Data:** dados tipados que serão assinados

```solidity
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

contract EIP712Example is EIP712 {
    using ECDSA for bytes32;
    
    // Estrutura da mensagem
    struct Mail {
        address to;
        string contents;
        uint256 nonce;
        uint256 deadline;
    }
    
    // Hash da estrutura (calculado apenas uma vez)
    bytes32 private constant MAIL_TYPEHASH = 
        keccak256("Mail(address to,string contents,uint256 nonce,uint256 deadline)");
    
    mapping(address => uint256) public nonces;
    mapping(bytes32 => bool) public usedSignatures;
    
    constructor() EIP712("MyApp", "1") {}
    
    function sendMessage(
        Mail memory mail,
        bytes memory signature
    ) public {
        require(block.timestamp <= mail.deadline, "Signature expired");
        require(!usedSignatures[_hashTypedDataV4(_hashMail(mail))], "Signature already used");
        
        // Verifica a assinatura
        bytes32 digest = _hashTypedDataV4(_hashMail(mail));
        address signer = digest.recover(signature);
        
        require(signer != address(0), "Invalid signature");
        require(nonces[signer] == mail.nonce, "Invalid nonce");
        
        // Marca como usado
        usedSignatures[digest] = true;
        nonces[signer]++;
        
        // Processar a mensagem...
        emit MessageSent(signer, mail.to, mail.contents);
    }
    
    function _hashMail(Mail memory mail) internal pure returns (bytes32) {
        return keccak256(abi.encode(
            MAIL_TYPEHASH,
            mail.to,
            keccak256(bytes(mail.contents)),
            mail.nonce,
            mail.deadline
        ));
    }
    
    // Helper para frontend gerar assinatura
    function getChainId() external view returns (uint256) {
        return block.chainid;
    }
    
    function getDomainSeparator() external view returns (bytes32) {
        return _domainSeparatorV4();
    }
    
    event MessageSent(address indexed from, address indexed to, string contents);
}

// Exemplo de Meta-Transaction com EIP-712
contract MetaTransaction is EIP712 {
    struct ForwardRequest {
        address from;
        address to;
        uint256 value;
        uint256 gas;
        uint256 nonce;
        bytes data;
        uint256 validUntilTime;
    }
    
    bytes32 private constant FORWARD_REQUEST_TYPEHASH = 
        keccak256("ForwardRequest(address from,address to,uint256 value,uint256 gas,uint256 nonce,bytes data,uint256 validUntilTime)");
    
    mapping(address => uint256) public nonces;
    
    constructor() EIP712("MinimalForwarder", "0.0.1") {}
    
    function verify(ForwardRequest calldata req, bytes calldata signature)
        public
        view
        returns (bool)
    {
        address signer = _hashTypedDataV4(_hashForwardRequest(req)).recover(signature);
        return nonces[req.from] == req.nonce && signer == req.from;
    }
    
    function execute(ForwardRequest calldata req, bytes calldata signature)
        public
        payable
        returns (bool, bytes memory)
    {
        require(verify(req, signature), "MinimalForwarder: signature does not match request");
        require(req.validUntilTime == 0 || req.validUntilTime > block.timestamp, "MinimalForwarder: request expired");
        
        nonces[req.from] = req.nonce + 1;
        
        (bool success, bytes memory returndata) = req.to.call{gas: req.gas, value: req.value}(
            abi.encodePacked(req.data, req.from)
        );
        
        return (success, returndata);
    }
    
    function _hashForwardRequest(ForwardRequest calldata req) internal pure returns (bytes32) {
        return keccak256(abi.encode(
            FORWARD_REQUEST_TYPEHASH,
            req.from,
            req.to,
            req.value,
            req.gas,
            req.nonce,
            keccak256(req.data),
            req.validUntilTime
        ));
    }
}
```

---

### 18. EIP-2612 (Permit)

Permite que usuários aprovem allowances (gastos) de tokens via assinatura, evitando chamadas on-chain de aprovação.

**Vantagens:**
- **Gasless approvals:** usuário não paga gas para aprovar
- **Better UX:** uma transação em vez de duas (approve + transferFrom)
- **Meta-transactions:** terceiros podem pagar o gas
- **Atomic operations:** approve + ação em uma única transação

**Como funciona:**
1. Usuário assina uma mensagem off-chain com os dados do permit
2. Contrato verifica a assinatura e aplica a aprovação
3. Executa a transferência na mesma transação

```solidity
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

// Token com suporte a Permit
contract MyTokenWithPermit is ERC20Permit {
    constructor() ERC20("MyToken", "MTK") ERC20Permit("MyToken") {
        _mint(msg.sender, 1000000 * 10**decimals());
    }
}

// Contrato que usa Permit para gasless interactions
contract PermitSpender {
    using ECDSA for bytes32;
    
    IERC20Permit public immutable token;
    
    struct PermitData {
        address owner;
        address spender;
        uint256 value;
        uint256 deadline;
        uint8 v;
        bytes32 r;
        bytes32 s;
    }
    
    constructor(address _token) {
        token = IERC20Permit(_token);
    }
    
    // Funcao que aceita permit e executa transferencia
    function transferWithPermit(
        PermitData calldata permit,
        address to,
        uint256 amount
    ) external {
        // Aplica o permit (gasless approval)
        token.permit(
            permit.owner,
            permit.spender,
            permit.value,
            permit.deadline,
            permit.v,
            permit.r,
            permit.s
        );
        
        // Executa a transferencia
        token.transferFrom(permit.owner, to, amount);
    }
    
    // Stake tokens usando permit em uma transacao
    function stakeWithPermit(
        uint256 amount,
        PermitData calldata permit
    ) external {
        // Aplica permit
        token.permit(
            permit.owner,
            address(this),
            permit.value,
            permit.deadline,
            permit.v,
            permit.r,
            permit.s
        );
        
        // Transfer tokens para stake
        token.transferFrom(permit.owner, address(this), amount);
        
        // Logica de stake...
        emit Staked(permit.owner, amount);
    }
    
    event Staked(address indexed user, uint256 amount);
}

// Implementacao customizada do EIP-2612
contract CustomPermitToken is ERC20, EIP712 {
    mapping(address => uint256) private _nonces;
    
    bytes32 private constant PERMIT_TYPEHASH =
        keccak256("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)");
    
    constructor() ERC20("CustomToken", "CTK") EIP712("CustomToken", "1") {}
    
    function permit(
        address owner,
        address spender,
        uint256 value,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) public {
        require(block.timestamp <= deadline, "ERC20Permit: expired deadline");
        
        bytes32 structHash = keccak256(abi.encode(
            PERMIT_TYPEHASH,
            owner,
            spender,
            value,
            _useNonce(owner),
            deadline
        ));
        
        bytes32 hash = _hashTypedDataV4(structHash);
        address signer = ECDSA.recover(hash, v, r, s);
        
        require(signer == owner, "ERC20Permit: invalid signature");
        
        _approve(owner, spender, value);
    }
    
    function nonces(address owner) public view returns (uint256) {
        return _nonces[owner];
    }
    
    function DOMAIN_SEPARATOR() external view returns (bytes32) {
        return _domainSeparatorV4();
    }
    
    function _useNonce(address owner) internal returns (uint256 current) {
        current = _nonces[owner];
        _nonces[owner]++;
    }
}

// Exemplo de uso no frontend (JavaScript/TypeScript)
/*
// Gerar assinatura no frontend
const domain = {
    name: 'MyToken',
    version: '1',
    chainId: await provider.getNetwork().then(n => n.chainId),
    verifyingContract: tokenAddress
};

const types = {
    Permit: [
        { name: 'owner', type: 'address' },
        { name: 'spender', type: 'address' },
        { name: 'value', type: 'uint256' },
        { name: 'nonce', type: 'uint256' },
        { name: 'deadline', type: 'uint256' }
    ]
};

const value = {
    owner: userAddress,
    spender: spenderAddress,
    value: amount,
    nonce: await token.nonces(userAddress),
    deadline: Math.floor(Date.now() / 1000) + 3600 // 1 hora
};

const signature = await signer._signTypedData(domain, types, value);
const { v, r, s } = ethers.utils.splitSignature(signature);
*/
```

---

Se quiser, posso te ajudar com perguntas e respostas para cada um desses tópicos, para simular um estudo tipo flashcards.
Quer?

---

## 🎯 TÓPICOS AVANÇADOS ADICIONAIS

### 19. Assembly e Inline Assembly

**Quando usar:**
- Otimizações críticas de gas
- Operações de baixo nível não disponíveis em Solidity
- Manipulação direta de storage slots
- Custom logic para proxies

```solidity
contract AssemblyExamples {
    // Operações básicas em assembly
    function addInAssembly(uint a, uint b) public pure returns (uint result) {
        assembly {
            result := add(a, b)
        }
    }
    
    // Verificar se endereço é contrato
    function isContract(address account) public view returns (bool) {
        uint256 size;
        assembly {
            size := extcodesize(account)
        }
        return size > 0;
    }
    
    // Clonagem eficiente de bytes
    function efficientCopy(bytes calldata data) external pure returns (bytes memory result) {
        assembly {
            result := mload(0x40)
            let length := data.length
            mstore(result, length)
            calldatacopy(add(result, 0x20), data.offset, length)
            mstore(0x40, add(result, add(0x20, length)))
        }
    }
    
    // Storage packing manual
    struct PackedData {
        uint128 a;
        uint128 b;
    }
    
    mapping(uint => PackedData) data;
    
    function setPackedData(uint key, uint128 a, uint128 b) external {
        assembly {
            let slot := add(data.slot, key)
            let packed := or(shl(128, a), b)
            sstore(slot, packed)
        }
    }
}
```

### 20. MEV (Maximal Extractable Value) Protection

**Conceitos:**
- Front-running: transação copiada com gas maior
- Back-running: transação executada logo após
- Sandwich attacks: transações antes e depois

```solidity
contract MEVProtection {
    // Commit-Reveal mais robusto
    struct Commitment {
        bytes32 hash;
        uint256 timestamp;
        bool revealed;
    }
    
    mapping(address => Commitment) public commitments;
    uint256 public constant REVEAL_DELAY = 1 hours;
    
    function commit(bytes32 hash) external {
        commitments[msg.sender] = Commitment({
            hash: hash,
            timestamp: block.timestamp,
            revealed: false
        });
    }
    
    function reveal(uint256 value, uint256 nonce) external {
        Commitment storage commitment = commitments[msg.sender];
        require(!commitment.revealed, "Already revealed");
        require(
            block.timestamp >= commitment.timestamp + REVEAL_DELAY,
            "Too early to reveal"
        );
        require(
            commitment.hash == keccak256(abi.encodePacked(value, nonce, msg.sender)),
            "Invalid reveal"
        );
        
        commitment.revealed = true;
        // Executar ação com value
    }
    
    // Time-weighted average price para evitar manipulation
    uint256 public constant TWAP_PERIOD = 30 minutes;
    
    struct PriceObservation {
        uint256 price;
        uint256 timestamp;
    }
    
    PriceObservation[] public priceHistory;
    
    function updatePrice(uint256 newPrice) internal {
        priceHistory.push(PriceObservation({
            price: newPrice,
            timestamp: block.timestamp
        }));
        
        // Manter apenas observações recentes
        while (priceHistory.length > 0 && 
               priceHistory[0].timestamp < block.timestamp - TWAP_PERIOD) {
            // Remove primeira observação (shift left)
            for (uint i = 0; i < priceHistory.length - 1; i++) {
                priceHistory[i] = priceHistory[i + 1];
            }
            priceHistory.pop();
        }
    }
    
    function getTWAP() public view returns (uint256) {
        require(priceHistory.length > 0, "No price data");
        
        uint256 weightedSum = 0;
        uint256 totalWeight = 0;
        
        for (uint i = 0; i < priceHistory.length; i++) {
            uint256 weight = TWAP_PERIOD - (block.timestamp - priceHistory[i].timestamp);
            weightedSum += priceHistory[i].price * weight;
            totalWeight += weight;
        }
        
        return weightedSum / totalWeight;
    }
}
```

### 21. Cross-Chain Communication

**Padrões populares:**
- LayerZero: unified messaging
- Chainlink CCIP: Cross-Chain Interoperability Protocol
- Wormhole: token bridges

```solidity
// Exemplo com LayerZero
import "@layerzerolabs/solidity-examples/contracts/lzApp/NonblockingLzApp.sol";

contract CrossChainToken is NonblockingLzApp {
    mapping(address => uint256) public balances;
    
    constructor(address _lzEndpoint) NonblockingLzApp(_lzEndpoint) {}
    
    function sendTokens(
        uint16 _dstChainId,
        address _toAddress,
        uint256 _amount
    ) external payable {
        require(balances[msg.sender] >= _amount, "Insufficient balance");
        
        balances[msg.sender] -= _amount;
        
        bytes memory payload = abi.encode(_toAddress, _amount);
        
        _lzSend(_dstChainId, payload, payable(msg.sender), address(0), bytes(""), msg.value);
    }
    
    function _nonblockingLzReceive(
        uint16 _srcChainId,
        bytes memory _srcAddress,
        uint64 _nonce,
        bytes memory _payload
    ) internal override {
        (address toAddress, uint256 amount) = abi.decode(_payload, (address, uint256));
        balances[toAddress] += amount;
    }
}
```

### 22. Testing Strategies

**Tipos de teste:**
- Unit tests: funções individuais
- Integration tests: contratos interagindo
- Fork tests: testes em estado real da blockchain
- Fuzzing: testes com inputs aleatórios

```solidity
// Exemplo de teste com Foundry
contract TokenTest is Test {
    MyToken token;
    address alice = address(0x1);
    address bob = address(0x2);
    
    function setUp() public {
        token = new MyToken();
        vm.deal(alice, 1 ether);
        vm.deal(bob, 1 ether);
    }
    
    function testTransfer() public {
        vm.startPrank(alice);
        token.mint(alice, 1000);
        token.transfer(bob, 100);
        vm.stopPrank();
        
        assertEq(token.balanceOf(alice), 900);
        assertEq(token.balanceOf(bob), 100);
    }
    
    function testFuzzTransfer(uint96 amount) public {
        vm.assume(amount > 0);
        
        vm.prank(alice);
        token.mint(alice, amount);
        
        vm.prank(alice);
        token.transfer(bob, amount);
        
        assertEq(token.balanceOf(bob), amount);
    }
    
    // Fork test
    function testForkMainnet() public {
        vm.createFork("https://mainnet.infura.io/v3/YOUR_KEY");
        
        // Teste com estado real da mainnet
        IERC20 usdc = IERC20(0xA0b86a33E6441d77d0B9ad9a92C6E1fb2A3fBd10);
        address whale = 0x...; // endereço com muito USDC
        
        vm.startPrank(whale);
        usdc.transfer(alice, 1000e6);
        vm.stopPrank();
        
        assertEq(usdc.balanceOf(alice), 1000e6);
    }
}
```

### 23. Security Checklist

**✅ Checklist essencial antes do deploy:**

1. **Access Control**
   - [ ] Verificar modificadores `onlyOwner`, `onlyRole`
   - [ ] Testar renúncia de ownership
   - [ ] Validar multi-sig para funções críticas

2. **Reentrancy**
   - [ ] Usar `nonReentrant` em funções que fazem external calls
   - [ ] Seguir pattern Checks-Effects-Interactions
   - [ ] Testar com contratos maliciosos

3. **Integer Overflow/Underflow**
   - [ ] Usar Solidity 0.8+ (built-in protection)
   - [ ] Ou SafeMath para versões anteriores
   - [ ] Considerar `unchecked{}` apenas quando seguro

4. **External Calls**
   - [ ] Verificar return values de `.call()`
   - [ ] Limitar gas para external calls quando possível
   - [ ] Usar `address.code.length > 0` para verificar contratos

5. **Storage Layout**
   - [ ] Documentar layout para upgrades
   - [ ] Usar `__gap` arrays em contratos upgradeables
   - [ ] Testar upgrades em testnet

6. **Events e Logging**
   - [ ] Emitir eventos para mudanças de estado importantes
   - [ ] Usar `indexed` para campos de busca
   - [ ] Não expor dados sensíveis em eventos

```solidity
// Exemplo de contrato auditado
contract SecureContract is ReentrancyGuard, Ownable, Pausable {
    using SafeERC20 for IERC20;
    
    // Eventos bem definidos
    event Deposit(address indexed user, uint256 amount, uint256 timestamp);
    event Withdrawal(address indexed user, uint256 amount, uint256 timestamp);
    
    // State variables organizadas
    IERC20 public immutable token;
    uint256 public constant MAX_WITHDRAWAL = 1000 ether;
    uint256 public constant WITHDRAWAL_DELAY = 1 days;
    
    mapping(address => uint256) public balances;
    mapping(address => uint256) public lastWithdrawal;
    
    // Custom errors (mais baratos)
    error InsufficientBalance(uint256 requested, uint256 available);
    error WithdrawalTooSoon(uint256 timeLeft);
    error ExceedsMaxWithdrawal(uint256 amount, uint256 max);
    
    constructor(address _token) {
        token = IERC20(_token);
    }
    
    function deposit(uint256 amount) 
        external 
        nonReentrant 
        whenNotPaused 
    {
        require(amount > 0, "Amount must be positive");
        
        // Effects primeiro
        balances[msg.sender] += amount;
        
        // Interaction por último
        token.safeTransferFrom(msg.sender, address(this), amount);
        
        emit Deposit(msg.sender, amount, block.timestamp);
    }
    
    function withdraw(uint256 amount) 
        external 
        nonReentrant 
        whenNotPaused 
    {
        // Validações
        if (balances[msg.sender] < amount) {
            revert InsufficientBalance(amount, balances[msg.sender]);
        }
        
        if (amount > MAX_WITHDRAWAL) {
            revert ExceedsMaxWithdrawal(amount, MAX_WITHDRAWAL);
        }
        
        if (block.timestamp < lastWithdrawal[msg.sender] + WITHDRAWAL_DELAY) {
            revert WithdrawalTooSoon(
                lastWithdrawal[msg.sender] + WITHDRAWAL_DELAY - block.timestamp
            );
        }
        
        // Effects
        balances[msg.sender] -= amount;
        lastWithdrawal[msg.sender] = block.timestamp;
        
        // Interaction
        token.safeTransfer(msg.sender, amount);
        
        emit Withdrawal(msg.sender, amount, block.timestamp);
    }
    
    // Emergency functions
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    function emergencyWithdraw() external onlyOwner whenPaused {
        token.safeTransfer(owner(), token.balanceOf(address(this)));
    }
}
```
