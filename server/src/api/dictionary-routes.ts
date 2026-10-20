import { Router } from 'express';
import { ok } from './types';
import { parseInput } from './validation';
import { DictionaryService, dictionaryCodesSchema } from '../services/dictionary.service';

export function createDictionaryRoutes(dictionaries: DictionaryService): Router {
  const routes = Router();
  routes.get('/', (req, res) => {
    const { codes } = parseInput(dictionaryCodesSchema, req.query);
    res.json(ok(dictionaries.getOptions(codes, true)));
  });
  return routes;
}
