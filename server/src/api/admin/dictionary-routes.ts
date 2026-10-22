import { Router } from 'express';
import { ok } from '../types';
import { parseInput } from '../validation';
import { requireAuth } from '../../middleware/auth.middleware';
import { AuthService } from '../../services/auth.service';
import {
  DictionaryService, createDictionarySchema, updateDictionarySchema,
  createDictionaryItemSchema, updateDictionaryItemSchema, dictionaryIdSchema, dictionaryCodesSchema,
  createDictionariesSchema, createDictionaryItemsSchema,
} from '../../services/dictionary.service';

export function createAdminDictionaryRoutes(auth: AuthService, dictionaries: DictionaryService): Router {
  const routes = Router();
  routes.use(requireAuth(auth));

  routes.get('/', (_req, res) => res.json(ok(dictionaries.list())));

  routes.get('/options', (req, res) => {
    const { codes } = parseInput(dictionaryCodesSchema, req.query);
    res.json(ok(dictionaries.getOptions(codes, false)));
  });

  routes.post('/', (req, res) => {
    const input = parseInput(createDictionarySchema, req.body);
    const type = dictionaries.createType(input);
    res.locals.operationTargetId = type.uuid;
    res.status(201).json(ok(type, '字典类型已创建'));
  });

  routes.post('/batch', (req, res) => {
    const { items } = parseInput(createDictionariesSchema, req.body);
    const types = dictionaries.createTypes(items);
    res.locals.operationTargetId = types.map((type) => type.uuid).join(',');
    res.status(201).json(ok(types, '字典类型已批量创建'));
  });

  routes.put('/:id', (req, res) => {
    const id = parseInput(dictionaryIdSchema, req.params.id);
    const type = dictionaries.updateType(id, parseInput(updateDictionarySchema, req.body));
    res.locals.operationTargetId = type.uuid;
    res.json(ok(type, '字典类型已更新'));
  });

  routes.post('/:id/items', (req, res) => {
    const typeId = parseInput(dictionaryIdSchema, req.params.id);
    const item = dictionaries.createItem(typeId, parseInput(createDictionaryItemSchema, req.body));
    res.locals.operationTargetId = item.uuid;
    res.status(201).json(ok(item, '字典子项已创建'));
  });

  routes.post('/:id/items/batch', (req, res) => {
    const typeId = parseInput(dictionaryIdSchema, req.params.id);
    const { items } = parseInput(createDictionaryItemsSchema, req.body);
    const created = dictionaries.createItems(typeId, items);
    res.locals.operationTargetId = created.map((item) => item.uuid).join(',');
    res.status(201).json(ok(created, '字典子项已批量创建'));
  });

  routes.put('/:id/items/:itemId', (req, res) => {
    const typeId = parseInput(dictionaryIdSchema, req.params.id);
    const itemId = parseInput(dictionaryIdSchema, req.params.itemId);
    const item = dictionaries.updateItem(typeId, itemId, parseInput(updateDictionaryItemSchema, req.body));
    res.locals.operationTargetId = item.uuid;
    res.json(ok(item, '字典子项已更新'));
  });

  return routes;
}
