import graphene
from ai_service.schema import Query as AIQuery, Mutation as AIMutation


class Query(AIQuery, graphene.ObjectType):
    pass


class Mutation(AIMutation, graphene.ObjectType):
    pass


schema = graphene.Schema(query=Query, mutation=Mutation)
