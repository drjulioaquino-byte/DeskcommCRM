---
impacto: capacidade_nova
secao: adicionado
titulo: Webhooks podem enviar somente o contato mínimo por regra
---
Na ação de chamar webhook, o gestor pode escolher enviar somente id, nome e telefone do contato vinculado, junto da etiqueta adicionada que configurou. A opção atende aos gatilhos de adição de etiqueta no contato ou no negócio e exige desligar o envio do responsável. Regras existentes mantêm o envio atual. Perfil inválido, vínculo divergente ou contato incompleto impedem o envio; a aba Atividade explica o motivo. Nenhuma migração ou configuração automática é necessária. Remover o recurso futuramente exige revisar ou pausar primeiro as regras que escolheram o modo mínimo, para não ampliar seus envios em silêncio.
