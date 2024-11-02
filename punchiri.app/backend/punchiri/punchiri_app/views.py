from rest_framework import viewsets, status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.http import StreamingHttpResponse
import cv2
import numpy as np
from .smile_analyzer import SmileAnalyzer
from .models import SmileAnalysis
from .serializers import SmileAnalysisSerializer

class SmileAnalysisViewSet(viewsets.ModelViewSet):
    queryset = SmileAnalysis.objects.all()
    serializer_class = SmileAnalysisSerializer

def get_frame(camera):
    while True:
        success, frame = camera.read()
        if not success:
            break
        else:
            ret, buffer = cv2.imencode('.jpg', frame)
            frame = buffer.tobytes()
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')

@api_view(['GET'])
def video_feed(request):
    camera = cv2.VideoCapture(0)
    return StreamingHttpResponse(get_frame(camera),
                               content_type='multipart/x-mixed-replace; boundary=frame')

@api_view(['POST'])
def analyze_smile(request):
    try:
        camera = cv2.VideoCapture(0)
        analyzer = SmileAnalyizer()
        
        # Capture and analyze a single frame
        success, frame = camera.read()
        if not success:
            return Response({'error': 'Failed to capture frame'}, 
                          status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        analysis_result, _ = analyzer.process_frame(frame)
        
        if analysis_result is None:
            return Response({'error': 'No face detected'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        # Save the analysis
        analysis = SmileAnalysis.objects.create(**analysis_result)
        
        camera.release()
        return Response(SmileAnalysisSerializer(analysis).data)
        
    except Exception as e:
        return Response({'error': str(e)}, 
                       status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    finally:
        if 'camera' in locals():
            camera.release()