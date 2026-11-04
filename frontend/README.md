# Schneider Imóveis — frontend

Interface React + Vite para a API Spring Boot deste repositório.

## Executar localmente

1. Inicie a API em `http://localhost:8080`.
2. Na pasta `frontend`, instale as dependências e inicie o Vite:

   ```sh
   npm install
   npm run dev
   ```

O servidor de desenvolvimento encaminha `/api/*` para `http://localhost:8080/*`.
Para outra URL, defina `VITE_API_URL` no ambiente de execução do Vite.

## Endpoints usados

O frontend integra os recursos atualmente implementados pela API: login JWT,
cadastro público, imóveis, bairros, tipos de imóveis, fotos e usuários. As telas
de ofertas, favoritos e contratos estão conectadas às rotas esperadas (`/ofertas`,
`/favoritos` e `/contratos`) e mostram o erro amigável retornado pela API quando
o recurso ainda não estiver disponível; elas não usam dados fictícios.

O backend de fotos salva o caminho local do arquivo, mas ainda não serve uma URL
pública para visualização das imagens. Por isso, a gestão de fotos informa essa
limitação e as imagens da vitrine usam uma imagem de apoio até que a API exponha
as fotos.
