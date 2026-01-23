from django.http import JsonResponse

# Create your views here.
def test_api(request):
    return JsonResponse({'message': 'Hello, world!'})

