using System;
using System.IO;
using Kaelix.BallGame;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.SceneManagement;

namespace Kaelix.BallGame.Editor
{
    public static class BallGameSceneBuilder
    {
        private const string ScenePath = "Assets/Scenes/BallGamePrototype.unity";
        private const string RuinsPrefabPath =
            "Assets/Symphonie/Ruins/URP/Prefabs/archway_pillar02.prefab";
        private const string MaterialsFolder = "Assets/Kaelix/BallGame/Materials";

        [MenuItem("Kaelix/Ball Game/Create Prototype Scene")]
        public static void CreateSceneFromMenu()
        {
            if (File.Exists(ScenePath) &&
                !EditorUtility.DisplayDialog(
                    "Rebuild Ball Game Prototype?",
                    "This will replace only BallGamePrototype.unity. The sensor test scene is not touched.",
                    "Rebuild",
                    "Cancel"))
            {
                return;
            }

            BuildAndSaveScene();
            EditorUtility.DisplayDialog(
                "Ball Game Prototype Ready",
                "Created Assets/Scenes/BallGamePrototype.unity. Press Play to test with WASD and Space.",
                "OK");
        }

        public static void CreateSceneFromCommandLine()
        {
            BuildAndSaveScene();
        }

        private static void BuildAndSaveScene()
        {
            EnsureFolder("Assets/Kaelix/BallGame", "Materials");

            var groundMaterial = GetOrCreateMaterial(
                $"{MaterialsFolder}/Ground.mat",
                new Color(0.12f, 0.16f, 0.13f));
            var wallMaterial = GetOrCreateMaterial(
                $"{MaterialsFolder}/Boundary.mat",
                new Color(0.22f, 0.25f, 0.22f));
            var ballMaterial = GetOrCreateMaterial(
                $"{MaterialsFolder}/Ball.mat",
                new Color(0.08f, 0.75f, 1f));

            var scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);

            var environment = new GameObject("Environment");
            CreateGround(environment.transform, groundMaterial);
            CreateBoundaries(environment.transform, wallMaterial);
            PlaceRuins(environment.transform);

            var ball = CreateBall(ballMaterial);
            CreateCamera(ball.transform);
            CreateLighting();

            var systems = new GameObject("Game Systems");
            systems.AddComponent<BallGameHud>();

            EditorSceneManager.SaveScene(scene, ScenePath);
            AddSceneToBuildSettings();
            AssetDatabase.SaveAssets();
            AssetDatabase.Refresh();
            Selection.activeGameObject = ball;

            Debug.Log($"Created isolated ball-game prototype at {ScenePath}");
        }

        private static void CreateGround(Transform parent, Material material)
        {
            var ground = GameObject.CreatePrimitive(PrimitiveType.Plane);
            ground.name = "Play Area";
            ground.transform.SetParent(parent);
            ground.transform.position = Vector3.zero;
            ground.transform.localScale = new Vector3(4f, 1f, 4f);
            ground.GetComponent<Renderer>().sharedMaterial = material;
        }

        private static void CreateBoundaries(Transform parent, Material material)
        {
            CreateWall(parent, "North Boundary", new Vector3(0f, 1f, 20f), new Vector3(42f, 2f, 1f), material);
            CreateWall(parent, "South Boundary", new Vector3(0f, 1f, -20f), new Vector3(42f, 2f, 1f), material);
            CreateWall(parent, "East Boundary", new Vector3(20f, 1f, 0f), new Vector3(1f, 2f, 42f), material);
            CreateWall(parent, "West Boundary", new Vector3(-20f, 1f, 0f), new Vector3(1f, 2f, 42f), material);
        }

        private static void CreateWall(
            Transform parent,
            string name,
            Vector3 position,
            Vector3 scale,
            Material material)
        {
            var wall = GameObject.CreatePrimitive(PrimitiveType.Cube);
            wall.name = name;
            wall.transform.SetParent(parent);
            wall.transform.position = position;
            wall.transform.localScale = scale;
            wall.GetComponent<Renderer>().sharedMaterial = material;
        }

        private static void PlaceRuins(Transform parent)
        {
            var prefab = AssetDatabase.LoadAssetAtPath<GameObject>(RuinsPrefabPath);
            if (prefab == null)
            {
                Debug.LogWarning($"Ruins prefab was not found at {RuinsPrefabPath}.");
                return;
            }

            var positions = new[]
            {
                new Vector3(-9f, 0f, 8f),
                new Vector3(9f, 0f, 8f),
                new Vector3(-9f, 0f, -4f),
                new Vector3(9f, 0f, -4f)
            };

            for (var index = 0; index < positions.Length; index++)
            {
                var ruin = (GameObject)PrefabUtility.InstantiatePrefab(prefab);
                ruin.name = $"Ruins Archway {index + 1}";
                ruin.transform.SetParent(parent);
                ruin.transform.position = positions[index];
                ruin.transform.rotation = Quaternion.Euler(0f, index % 2 == 0 ? 25f : -25f, 0f);
                ScaleAndGroundRuin(ruin, 6f);
            }
        }

        private static void ScaleAndGroundRuin(GameObject ruin, float targetHeight)
        {
            var renderers = ruin.GetComponentsInChildren<Renderer>();
            if (renderers.Length == 0)
            {
                return;
            }

            var bounds = renderers[0].bounds;
            for (var index = 1; index < renderers.Length; index++)
            {
                bounds.Encapsulate(renderers[index].bounds);
            }

            if (bounds.size.y > 0.01f)
            {
                ruin.transform.localScale *= targetHeight / bounds.size.y;
            }

            bounds = ruin.GetComponentInChildren<Renderer>().bounds;
            ruin.transform.position += Vector3.up * -bounds.min.y;
        }

        private static GameObject CreateBall(Material material)
        {
            var ball = GameObject.CreatePrimitive(PrimitiveType.Sphere);
            ball.name = "Player Ball";
            ball.transform.position = new Vector3(0f, 1f, -12f);
            ball.GetComponent<Renderer>().sharedMaterial = material;

            var body = ball.AddComponent<Rigidbody>();
            body.mass = 1.2f;
            body.linearDamping = 0.35f;
            body.angularDamping = 0.08f;
            body.interpolation = RigidbodyInterpolation.Interpolate;
            body.collisionDetectionMode = CollisionDetectionMode.ContinuousDynamic;

            ball.AddComponent<BallController>();
            return ball;
        }

        private static void CreateCamera(Transform target)
        {
            var cameraObject = new GameObject("Main Camera");
            cameraObject.tag = "MainCamera";
            cameraObject.transform.position = target.position + new Vector3(0f, 8f, -10f);

            var camera = cameraObject.AddComponent<Camera>();
            camera.fieldOfView = 60f;
            cameraObject.AddComponent<AudioListener>();

            var followCamera = cameraObject.AddComponent<FollowCamera>();
            followCamera.Configure(target);
            cameraObject.transform.LookAt(target);
        }

        private static void CreateLighting()
        {
            var lightObject = new GameObject("Directional Light");
            lightObject.transform.rotation = Quaternion.Euler(45f, -35f, 0f);

            var light = lightObject.AddComponent<Light>();
            light.type = LightType.Directional;
            light.intensity = 1.4f;
            light.shadows = LightShadows.Soft;

            RenderSettings.ambientLight = new Color(0.35f, 0.38f, 0.42f);
        }

        private static Material GetOrCreateMaterial(string path, Color color)
        {
            var existing = AssetDatabase.LoadAssetAtPath<Material>(path);
            if (existing != null)
            {
                return existing;
            }

            var shader = Shader.Find("Universal Render Pipeline/Lit") ?? Shader.Find("Standard");
            var material = new Material(shader)
            {
                color = color
            };
            AssetDatabase.CreateAsset(material, path);
            return material;
        }

        private static void EnsureFolder(string parent, string child)
        {
            var path = $"{parent}/{child}";
            if (!AssetDatabase.IsValidFolder(path))
            {
                AssetDatabase.CreateFolder(parent, child);
            }
        }

        private static void AddSceneToBuildSettings()
        {
            var existingScenes = EditorBuildSettings.scenes;
            foreach (var existingScene in existingScenes)
            {
                if (string.Equals(existingScene.path, ScenePath, StringComparison.OrdinalIgnoreCase))
                {
                    return;
                }
            }

            var scenes = new EditorBuildSettingsScene[existingScenes.Length + 1];
            Array.Copy(existingScenes, scenes, existingScenes.Length);
            scenes[^1] = new EditorBuildSettingsScene(ScenePath, true);
            EditorBuildSettings.scenes = scenes;
        }
    }
}
