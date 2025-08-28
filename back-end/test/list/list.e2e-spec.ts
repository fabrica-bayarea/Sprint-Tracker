import {ListService} from "../../src/list/list.service"
import { ListModule } from "src/list/list.module"
import { INestApplication } from "@nestjs/common"
import request from "supertest"
import { Test } from "@nestjs/testing"

//teste da criação de uma lista a partir de um board existente
describe('List', ()=>{
    let app: INestApplication;
    const listService = {
        findAll: () => ['test'],
        create: (dto: any) => ({
            id: 1,
            ... dto
        })
    }

    beforeAll(async () => {
        const moduleRef = await Test.createTestingModule({
            imports: [ListModule]
        })
            .overrideProvider(ListService)
            .useValue(listService)
            .compile()

        app = moduleRef.createNestApplication()
        await app.init()
    })
    it(`/GET lists`, ()=>{
        return request(app.getHttpServer())
        .get('/lists')
        .expect(200)
        .expect({
            data: listService.findAll()
        })
    })

    it('/POST lists', () => {
        return request(app.getHttpServer())
            .post('/lists')
            .expect(200)
            .expect({
                data:{
                    id: 1,
                    title: 'List Teste',
                    description: 'Testando Desc List'
                }
            })
    })
})