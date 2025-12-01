# Correção do Erro Babel - NativeWind

## Erro
```
[BABEL] .plugins is not a valid Plugin property
```

## Configuração Atual
```javascript
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'nativewind/babel',
    ],
  };
};
```

## Soluções Testadas

1. ✅ Removido `react-native-reanimated/plugin` (já incluído no babel-preset-expo)
2. ✅ Limpeza de cache (.expo e node_modules/.cache)
3. ✅ Configuração simplificada do NativeWind

## Próximos Passos se o Erro Persistir

1. **Reinstalar dependências:**
   ```bash
   cd luma-app
   rm -rf node_modules
   npm install
   ```

2. **Verificar versão do Node.js:**
   - Recomendado: Node.js LTS (18.x ou 20.x)
   - Verificar: `node -v`

3. **Verificar se NativeWind está instalado corretamente:**
   ```bash
   npm list nativewind
   ```

4. **Testar sem NativeWind temporariamente:**
   - Remover `'nativewind/babel'` do babel.config.js
   - Verificar se o erro desaparece
   - Se sim, o problema está no NativeWind

5. **Alternativa: Usar configuração do NativeWind v4:**
   ```javascript
   module.exports = function(api) {
     api.cache(true);
     return {
       presets: ['babel-preset-expo'],
       plugins: [
         ['nativewind/babel', {}],
       ],
     };
   };
   ```

## Nota
O `babel-preset-expo` já inclui o plugin do Reanimated automaticamente, então não precisamos adicioná-lo manualmente.




