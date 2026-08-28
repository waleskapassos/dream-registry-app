# Waleska e Ailton

Um site simples de casamento com uma página principal com 3 botões na interface principal. 1 botão de Lista de Presentes, 1 botão de Localização da cerimônia e 1 botão de confirmar presença. Ao clicar nos botões quero que abra sua respectivas páginas. No caso da página de lista de presente quero que mostre os itens que estou pedindo com foto e o botão de comprar e adicionar ao carrinho. Quero que tenha a opcao de pix, crédito e débito para que o convidado pague e Caio diretamente na minha conta PJ. Quero que tenha a opcao de inserir oa itens que vamos pedir de presente e a opcao de editar foto e descrição doa itens.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://dream-registry-app.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/2d264646-e9ec-495c-be54-8dd03bf4f861).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Pagamentos em produção

Crédito e débito usam o Checkout Pro do Mercado Pago. No ambiente publicado do
Lovable, configure estes secrets:

```env
APP_URL=https://dream-registry-app.lovable.app
MERCADO_PAGO_ACCESS_TOKEN=APP_USR-...
```

Use o Access Token de **Produção** da conta PJ que receberá os pagamentos. Chaves
que começam com `TEST-` são recusadas para impedir que o site publicado envie o
convidado ao checkout de teste. Depois de salvar os secrets, publique novamente
o projeto.
