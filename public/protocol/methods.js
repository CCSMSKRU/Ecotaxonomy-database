var paramExample = {
    required: true,
    default: 'test',
    valueMethod:'val', // html() ...
    validation: { // Здесь может быть объект, массив или значение. Объект использует format, func
        format: [
            {
                func: 'addToEnd',
                args: ['Добавим текст в конец']
            },
            {
                func: 'addToEnd',
                args: ['Еще добавим.']
            }
        ],
        func: 'notNull'
    }
};


var methodos = {
    test: {
        name:'User.get_me',
        name_ru:'User.get_me',
        description:'Вернет информацию о пользоваеле протокола',
        responseJSON:
            '' +
            '\nНет примера\n' +
            '',
        o:{
            command:'get_me',
            object:'User',
            params:{

            }
        }
    },
    createOrder: {
        name:'createOrder',
        name_ru:'Создать заказ',
        description:'Создаст заказ в системе',
        responseJSON:
            '' +
            '\nНет примера\n' +
            '',
        o:{
            command:'add',
            object: 'order_',
            params:{
                name: {
                    default: 'Бандероль'
                },
                description: {
                    default: 'Позвоните Оле за час до прибытия в вотсап, спасибо!'
                },
                from_address: {
                    default: 'Москва, тимирязевская ул 20'
                },
                to_address: {
                    default:'Москва, Космонавта волкова 2'
                },
                sender_firstname: {
                    default:'Оля'
                },
                sender_lastname: {
                    default:'Петрова'
                },
                sender_phone: {
                    default:'79060635584'
                },
                sender_email: {
                    default:'mail@mail.ru'
                },
                reciever_firstname: {
                    default:'Коля'
                },
                reciever_lastname: {
                    default:'Сидоров'
                },
                reciever_phone: {
                    default:'79060645465'
                },
                reciever_email: {
                    default:'mail@gmail.com'
                },
                height: {
                    default:'1'
                },
                length: {
                    default:'2'
                },
                width: {
                    default:'3'
                },
                weight: {
                    default:'4'
                },
                date: {
                    default: '13.04.2020'
                }
            }
        }
    },
    setGotCargo: {
        name:'setGotCargo',
        name_ru:'Груз получен',
        description:'Переведет заказ в статус GOT_CARGO',
        responseJSON:
        '' +
        '\nНет примера\n' +
        '',
        o:{
            command:'modify',
            object: 'order_',
            params:{
                courier_id: {
                    default: 'Укажите id курьера'
                },
                id: {
                    default: 'Укажите id заказа'
                },
                order_status_sysname: {
                    default: 'GOT_CARGO'
                }
            }
        }
    },
    setSuccess: {
        name:'setSuccess',
        name_ru:'Доставлено',
        description:'Переведет заказ в статус SUCCESS',
        responseJSON:
        '' +
        '\nНет примера\n' +
        '',
        o:{
            command:'modify',
            object: 'order_',
            params:{
                courier_id: {
                    default: 'Укажите id курьера'
                },
                id: {
                    default: 'Укажите id заказа'
                },
                order_status_sysname: {
                    default: 'SUCCESS'
                }
            }
        }
    },
    setProblem: {
        name:'setProblem',
        name_ru:'Проблема с заказом',
        description:'Переведет заказ в статус PROBLEM',
        responseJSON:
        '' +
        '\nНет примера\n' +
        '',
        o:{
            command:'modify',
            object: 'order_',
            params:{
                courier_id: {
                    default: 'Укажите id курьера'
                },
                id: {
                    default: 'Укажите id заказа'
                },
                order_status_sysname: {
                    default: 'PROBLEM'
                }
            }
        }
    }
};
