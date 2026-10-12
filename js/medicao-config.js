/* Chave publica do Supabase. E anon por definicao: fica no navegador de
   quem visita e so consegue o que as politicas permitem, que aqui e
   gravar evento. Nao da acesso a lead nem a dado de ninguem.

   Mesmo projeto e mesma tabela do quiz de insonia, que ja tem painel
   funcionando. O que separa as paginas e o prefixo do tipo de evento e
   o campo site no metadata:

     bio_*   com site 'linkbio'    -> o link da bio
     mnt_*   com site 'mentoria'   -> a pagina de mentoria
     tsl_*   com site da TSL       -> a pagina de venda do insonia
*/
window.MEDICAO = {
  url:    'https://gqibxdwvagjvvhixmcsg.supabase.co',
  anon:   'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxaWJ4ZHd2YWdqdnZoaXhtY3NnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAyODQ4MzIsImV4cCI6MjEwNTg2MDgzMn0.W1J5Ykd5zg5KmyQ91Hzas2NfAZytJmIgmfi8SwBWLyw',
  quizId: '1b52c0b8-17c1-40fe-8a88-f832b6f88d4d'
};
